// Here is a brief technical description of each function in the Python script:

// 1. `evm_wallet(key: str) -> str`: This function accepts a string argument, `key`, which represents an Ethereum wallet key. It attempts to use the `Web3` Python library to convert the key to a wallet address. If unsuccessful, it tries again, up to a maximum of two times. If both attempts fail, it returns the original key.

// 2. `round_to(num: float, digits: int = 3) -> float`: This function accepts a float number `num` and an optional integer `digits` (default 3). It calculates the number of digits after the decimal in `num`, and then rounds `num` to the number of decimal places calculated plus `digits` - 1. If the number of decimal places is less than `digits`, it rounds to `digits` decimal places. If any errors occur, it simply returns `num`【7†source】.

// 3. `get_prices(datas: dict) -> dict`: This function accepts a dictionary `datas` that contains data about different blockchain chains and their corresponding tokens. For each chain and token, it fetches the current price in USDT from the CryptoCompare API, and updates a dictionary `prices` with the token symbol and price. If any errors occur during the price fetch, it logs the error and sets the price for that token to 0【8†source】.
async function getPrices() {

}
// 4. `check_data_token(web3: Web3, token_address: str) -> Tuple`: This asynchronous function accepts a `web3` object and a `token_address` string. It attempts to get the decimal value and symbol of the token at the provided address using the contract ABI. If any errors occur, it waits for 2 seconds and then retries the operation【9†source】.

// 5. `check_balance(web3: Web3, wallet: str, chain: str, address_contract: str) -> Tuple`: This asynchronous function accepts a `web3` object, a `wallet` string, a `chain` string, and an `address_contract` string. It tries to get the balance of the wallet for the token at the provided address on the given chain. It returns the balance in a human-readable format along with the token symbol. If any errors occur, it waits for 1 second and then retries the operation【10†source】.

// 6. `worker(wallet: str, datas: dict) -> None`: This asynchronous function accepts a `wallet` string and a `datas` dictionary. It checks the balance of the wallet for each token on each chain in `datas`, and updates a global `RESULT` dictionary with the wallet, chain, token symbol, and balance【11†source】.

// 7. `main(datas: dict, wallets: list) -> None`: This asynchronous function accepts a `datas` dictionary and a `wallets` list. It creates a list of `worker` tasks for each wallet, and then runs all the tasks concurrently using `asyncio.gather()`【12†source】.

// 8. `send_result(min_balance: dict, file_name: str, prices: dict) -> None`: This function accepts a `min_balance` dictionary, a `file_name` string, and a `prices` dictionary. It calculates the total balance and value in USD for each token in each wallet, and writes the results to a CSV file. It also prints the results to the console, and logs any wallets with a balance lower than `min_balance`【18†source】.

// 9. `web3_check() -> None`: This function initiates the process of checking the balances of various wallets on different blockchain chains. It loads the wallets from a

// global `WALLETS` variable, converts each wallet key to a wallet address, and initializes the `RESULT` dictionary. It fetches current token prices, runs the `main()` function to check all wallet balances, and then sends the results【18†source】.
