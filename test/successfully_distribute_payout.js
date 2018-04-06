const Contract = artifacts.require("./Game.sol");

let moment = require("moment");

contract('Place Bet : ', async (accounts) => {

    //Current timestamp
    let now = moment().utc();

    //Set start 10min from now & end time 1hr 40min from now
    //considering a game is 90min
    let start = now.add({minutes : 10}).unix();
    let end = now.add({minutes: 100}).unix();

    it('successfully transfer payout', async () => {
        let game = await Contract.new(start,end);

        //Place bets
        await game.placeBet('swansea',{value: web3.toWei(0.1, "ether"), from: accounts[1]});
        await game.placeBet('swansea',{value: web3.toWei(0.2, "ether"), from: accounts[2]});
        await game.placeBet('realmadrid',{value: web3.toWei(0.3, "ether"), from: accounts[3]});
        await game.placeBet('realmadrid',{value: web3.toWei(0.4, "ether"), from: accounts[4]});

        //End game
        await game.endGame();

        //Retrieve winner from oracle
        await game.getWinner({value: web3.toWei(0.1, "ether")});

        // Wait for the callback to be invoked by oraclize and the event to be emitted
        const logWhenBetClosed = promisifyLogWatch(game.BetClosed({ fromBlock: 'latest' }));

        await logWhenBetClosed;

        await game.distributeStake();

        let payout = await game.payout();

        assert.equal(0.7, payout / 10 ** 18);
    });

    /**
     * @credit https://github.com/AdamJLemmon
     * Helper to wait for log emission.
     * @param  {Object} _event The event to wait for.
     */
    function promisifyLogWatch(_event) {
        return new Promise((resolve, reject) => {
            _event.watch((error, log) => {
                _event.stopWatching();
                if (error !== null)
                    reject(error);

                resolve(log);
            });
        });
    }
});
