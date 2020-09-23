use cosmwasm_std::{
    log, to_binary, Api, BankMsg, Binary, CosmosMsg, Env, Extern, HandleResponse, HumanAddr,
    InitResponse, Querier, StdError, StdResult, Storage,
};

use crate::msg::{FeeResponse, HandleMsg, InitMsg, Payment, QueryMsg};
use crate::state::{config, config_read, State};

pub fn init<S: Storage, A: Api, Q: Querier>(
    deps: &mut Extern<S, A, Q>,
    env: Env,
    msg: InitMsg,
) -> StdResult<InitResponse> {
    let state = State {
        fee: msg.fee,
        owner: deps.api.canonical_address(&env.message.sender)?,
    };

    config(&mut deps.storage).save(&state)?;

    Ok(InitResponse::default())
}

pub fn handle<S: Storage, A: Api, Q: Querier>(
    deps: &mut Extern<S, A, Q>,
    env: Env,
    msg: HandleMsg,
) -> StdResult<HandleResponse> {
    match msg {
        HandleMsg::Echo { recipient } => try_echo(deps, env, &recipient),
        HandleMsg::MultiSend { payments } => try_multisend(deps, env, &payments),
    }
}

pub fn try_echo<S: Storage, A: Api, Q: Querier>(
    _deps: &mut Extern<S, A, Q>,
    env: Env,
    recipient: &HumanAddr,
) -> StdResult<HandleResponse> {
    if env.message.sent_funds.is_empty() {
        return Err(StdError::generic_err(
            "You must pass some coins to send to an address",
        ));
    }
    let log = vec![log("action", "send"), log("recipient", recipient.as_str())];
    let from_address = env.contract.address.clone();
    let to_recipient = recipient.clone();

    let r = HandleResponse {
        messages: vec![CosmosMsg::Bank(BankMsg::Send {
            from_address: from_address,
            to_address: to_recipient,
            amount: env.message.sent_funds,
        })],
        log,
        data: None,
    };
    Ok(r)
}

pub fn try_multisend<S: Storage, A: Api, Q: Querier>(
    deps: &mut Extern<S, A, Q>,
    env: Env,
    payments: &Vec<Payment>,
) -> StdResult<HandleResponse> {
    if env.message.sent_funds.is_empty() {
        return Err(StdError::generic_err(
            "You must pass some coins to send make a multisend",
        ));
    }
    let mut messages = vec![];
    let mut log_to_send = vec![];

    let state = config_read(&deps.storage).load()?;
    let fee = state.fee;
    let owner = state.owner;

    let index = env
        .message
        .sent_funds
        .iter()
        .enumerate()
        .find_map(|(i, exist)| {
            if exist.denom == fee.denom {
                Some(i)
            } else {
                None
            }
        });

    match index {
        Some(idx) => {
            if env.message.sent_funds[idx].amount < fee.amount {
                return Err(StdError::generic_err("Incefficiant fee to cover costs"));
            }
            let from_address = env.contract.address.clone();
            messages.push(CosmosMsg::Bank(BankMsg::Send {
                from_address: from_address,
                to_address: deps.api.human_address(&owner.clone())?,
                amount: vec![fee.clone()],
            }));
            log_to_send.push(log("owner payed", deps.api.human_address(&owner)?.as_str()));
        }
        None => {
            return Err(StdError::generic_err(
                "You must pay a fee with the specified token",
            ));
        }
    }

    for payment in payments {
        let from_address = env.contract.address.clone();
        let to_recipient = payment.recipient.clone();
        messages.push(CosmosMsg::Bank(BankMsg::Send {
            from_address: from_address,
            to_address: to_recipient,
            amount: payment.pay.clone(),
        }));
        log_to_send.push(log("recipient", payment.recipient.as_str()));
    }

    let r = HandleResponse {
        messages: messages,
        log: log_to_send,
        data: None,
    };
    Ok(r)
}

pub fn query<S: Storage, A: Api, Q: Querier>(
    deps: &Extern<S, A, Q>,
    msg: QueryMsg,
) -> StdResult<Binary> {
    match msg {
        QueryMsg::GetFee {} => to_binary(&query_fee(deps)?),
    }
}

fn query_fee<S: Storage, A: Api, Q: Querier>(deps: &Extern<S, A, Q>) -> StdResult<FeeResponse> {
    let state = config_read(&deps.storage).load()?;
    Ok(FeeResponse { fee: state.fee })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::msg::Payment;
    use cosmwasm_std::testing::{mock_dependencies, mock_env};
    use cosmwasm_std::{coins, from_binary, Coin, StdError, Uint128};

    #[test]
    fn proper_initialization() {
        let mut deps = mock_dependencies(20, &[]);
        let fee = Coin {
            amount: Uint128(100),
            denom: "token".to_string(),
        };

        let msg = InitMsg { fee: fee.clone() };
        let env = mock_env("creator", &coins(1000, "token"));

        // we can just call .unwrap() to assert this was a success
        let res = init(&mut deps, env, msg).unwrap();
        assert_eq!(0, res.messages.len());

        // it worked, let's query the state
        let res = query(&deps, QueryMsg::GetFee {}).unwrap();
        let value: FeeResponse = from_binary(&res).unwrap();
        assert_eq!(fee, value.fee);
    }

    #[test]
    fn failed_echo() {
        let mut deps = mock_dependencies(20, &[]);
        let fee = Coin {
            amount: Uint128(100),
            denom: "token".to_string(),
        };

        let msg = InitMsg { fee: fee.clone() };
        let env = mock_env("creator", &coins(1000, "token"));

        let _res = init(&mut deps, env, msg).unwrap();

        let env = mock_env("anyone", &[]);
        let msg = HandleMsg::Echo {
            recipient: HumanAddr::from("recipient"),
        };
        let res = handle(&mut deps, env, msg);
        match res {
            Ok(_) => panic!("expected error"),
            Err(StdError::GenericErr { msg, .. }) => {
                assert_eq!(msg, "You must pass some coins to send to an address")
            }
            Err(e) => panic!("unexpected error: {:?}", e),
        }
    }

    #[test]
    fn echo() {
        let mut deps = mock_dependencies(20, &[]);
        let fee = Coin {
            amount: Uint128(100),
            denom: "token".to_string(),
        };

        let msg = InitMsg { fee: fee.clone() };
        let env = mock_env("creator", &coins(1000, "token"));

        let _res = init(&mut deps, env, msg).unwrap();

        let balance = coins(100, "token");
        let env = mock_env("anyone", &balance);
        let msg = HandleMsg::Echo {
            recipient: HumanAddr::from("recipient"),
        };

        //deps.querier.update_balance("anyone", coins(200, "token"));
        //let query_balance = deps.querier.query_all_balances("anyone");
        //println!("Balance {:#?}", query_balance);

        let res = handle(&mut deps, env, msg).unwrap();
        let msg = res.messages.get(0).expect("no message");
        assert_eq!(
            msg,
            &CosmosMsg::Bank(BankMsg::Send {
                from_address: HumanAddr::from("cosmos2contract"),
                to_address: HumanAddr::from("recipient"),
                amount: coins(100, "token"),
            })
        );
        assert_eq!(
            res.log,
            vec![log("action", "send"), log("recipient", "recipient"),]
        );
    }

    #[test]
    fn multisend() {
        let mut deps = mock_dependencies(20, &[]);
        let fee = Coin {
            amount: Uint128(100),
            denom: "token".to_string(),
        };

        let msg = InitMsg { fee: fee.clone() };
        let env = mock_env("creator", &coins(1000, "token"));

        let _res = init(&mut deps, env, msg).unwrap();

        let balance = coins(200, "token");
        let env = mock_env("anyone", &balance);
        let coin = Coin {
            amount: Uint128(100),
            denom: "token".to_string(),
        };
        let payment1 = Payment {
            recipient: HumanAddr::from("recipient1"),
            pay: vec![coin.clone()],
        };
        let payment2 = Payment {
            recipient: HumanAddr::from("recipient2"),
            pay: vec![coin.clone()],
        };

        let msg = HandleMsg::MultiSend {
            payments: vec![payment1, payment2],
        };

        let res = handle(&mut deps, env, msg).unwrap();
        println!("Messages {:#?}", res.messages);
        println!("Log {:#?}", res.log);
    }

    #[test]
    fn empty_multisend() {
        let mut deps = mock_dependencies(20, &[]);
        let fee = Coin {
            amount: Uint128(100),
            denom: "token".to_string(),
        };

        let msg = InitMsg { fee: fee.clone() };
        let env = mock_env("creator", &coins(1000, "token"));

        let _res = init(&mut deps, env, msg).unwrap();

        let env = mock_env("anyone", &[]);
        let coin = Coin {
            amount: Uint128(100),
            denom: "token".to_string(),
        };
        let payment1 = Payment {
            recipient: HumanAddr::from("recipient1"),
            pay: vec![coin.clone()],
        };

        let msg = HandleMsg::MultiSend {
            payments: vec![payment1],
        };
        let res = handle(&mut deps, env, msg);
        match res {
            Ok(_) => panic!("expected error"),
            Err(StdError::GenericErr { msg, .. }) => {
                assert_eq!(msg, "You must pass some coins to send make a multisend")
            }
            Err(e) => panic!("unexpected error: {:?}", e),
        }
    }

    #[test]
    fn no_token_of_fee_multisend() {
        let mut deps = mock_dependencies(20, &[]);
        let fee = Coin {
            amount: Uint128(100),
            denom: "token".to_string(),
        };

        let msg = InitMsg { fee: fee.clone() };
        let env = mock_env("creator", &coins(1000, "token"));

        let _res = init(&mut deps, env, msg).unwrap();

        let balance = coins(200, "fake");
        let env = mock_env("anyone", &balance);
        let coin = Coin {
            amount: Uint128(100),
            denom: "token".to_string(),
        };
        let payment1 = Payment {
            recipient: HumanAddr::from("recipient1"),
            pay: vec![coin.clone()],
        };

        let msg = HandleMsg::MultiSend {
            payments: vec![payment1],
        };
        let res = handle(&mut deps, env, msg);
        match res {
            Ok(_) => panic!("expected error"),
            Err(StdError::GenericErr { msg, .. }) => {
                assert_eq!(msg, "You must pay a fee with the specified token")
            }
            Err(e) => panic!("unexpected error: {:?}", e),
        }
    }

    #[test]
    fn incefficient_fee() {
        let mut deps = mock_dependencies(20, &[]);
        let fee = Coin {
            amount: Uint128(100),
            denom: "token".to_string(),
        };

        let msg = InitMsg { fee: fee.clone() };
        let env = mock_env("creator", &coins(1000, "token"));

        let _res = init(&mut deps, env, msg).unwrap();

        // Only pay 50 fee
        let balance = coins(50, "token");
        let env = mock_env("anyone", &balance);
        let coin = Coin {
            amount: Uint128(100),
            denom: "token".to_string(),
        };
        let payment1 = Payment {
            recipient: HumanAddr::from("recipient1"),
            pay: vec![coin.clone()],
        };

        let msg = HandleMsg::MultiSend {
            payments: vec![payment1],
        };
        let res = handle(&mut deps, env, msg);
        match res {
            Ok(_) => panic!("expected error"),
            Err(StdError::GenericErr { msg, .. }) => {
                assert_eq!(msg, "Incefficiant fee to cover costs")
            }
            Err(e) => panic!("unexpected error: {:?}", e),
        }
    }
}
