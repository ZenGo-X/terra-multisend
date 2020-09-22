use cosmwasm_std::testing::{mock_dependencies, mock_env};
use cosmwasm_std::{
    coins, from_slice, log, Api, Coin, Env, HumanAddr, ReadonlyStorage, StdError, Storage, Uint128,
};
use cosmwasm_storage::ReadonlyPrefixedStorage;

use crate::contract::{
    bytes_to_u128, handle, init, query, read_u128, Constants, KEY_CONSTANTS, KEY_TOTAL_SUPPLY,
    PREFIX_ALLOWANCES, PREFIX_BALANCES, PREFIX_CONFIG,
};
use crate::msg::{HandleMsg, InitMsg, QueryMsg};

static CANONICAL_LENGTH: usize = 20;

fn mock_env_height(signer: &HumanAddr, sent: &[Coin], height: u64, time: u64) -> Env {
    let mut env = mock_env(signer, sent);
    env.block.height = height;
    env.block.time = time;
    env
}

fn get_constants<S: Storage>(storage: &S) -> Constants {
    let config_storage = ReadonlyPrefixedStorage::new(PREFIX_CONFIG, storage);
    let data = config_storage
        .get(KEY_CONSTANTS)
        .expect("no config data stored");
    from_slice(&data).expect("invalid data")
}

mod init {
    use super::*;

    #[test]
    fn works() {
        let mut deps = mock_dependencies(CANONICAL_LENGTH, &[]);
        let init_msg = InitMsg { fee: 1 };
        let init_amount = coins(1000, "earth");
        let env = mock_env_height(&HumanAddr("creator".to_string()), &init_amount, 450, 550);
        let res = init(&mut deps, env, init_msg).unwrap();
        assert_eq!(0, res.messages.len());

        assert_eq!(get_constants(&deps.storage), Constants { fee: 1 });
    }
}

mod transfer {
    use super::*;

    fn make_init_msg() -> InitMsg {
        InitMsg { fee: 1 }
    }

    #[test]
    fn can_send() {
        let mut deps = mock_dependencies(CANONICAL_LENGTH, &[]);
        let init_msg = InitMsg { fee: 1 };
        let init_amount = coins(1000, "earth");
        let env = mock_env_height(&HumanAddr("creator".to_string()), &init_amount, 450, 550);
    }
}
