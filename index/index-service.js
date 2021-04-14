const Seneca = require('seneca');
var seneca = Seneca();
const MiniSearch = require('minisearch');

var indexation = function(options) {

    this.add('index:search', function(msg, done) {
        var savedData = [];
        let key = msg.key;
        let value = msg.value;
        for(i = 0; i < msg.allWR.length; i++) {
            savedData.push(msg.allWR[i].data[0]);
        }
        console.log("Saved data : " + JSON.stringify(savedData));

        let miniSearch = new MiniSearch({
            fields: ['applicant', 'work', 'dc_date', 'state'], // fields to index for full-text search
            storeFields: ['applicant', 'work', 'dc_date', 'state', 'id', 'compl_date'] // fields to return with search results
        })

        miniSearch.addAll(savedData);

        let results = miniSearch.search(value);
        console.log("Results : " + results);

        let item;
        if(results.length === 0) {
            item = {
                success: true,
                data: []
            }
        } else {
            var dataArr = [];
            for(i = 0; i < results.length; i++) {
                var dataTemp;
                if (results[i].state === "closed") {
                    dataTemp = {
                        applicant: results[i].applicant,
                        work: results[i].work,
                        dc_date: results[i].dc_date,
                        id: results[i].id,
                        state: results[i].state,
                        compl_date: results[i].compl_date,
                    };
                } else {
                    dataTemp = {
                        applicant: results[i].applicant,
                        work: results[i].work,
                        dc_date: results[i].dc_date,
                        id: results[i].id,
                        state: results[i].state,
                        compl_date: results[i].compl_date,
                    };
                }
                dataArr.push(dataTemp);
                item = {
                    success: true,
                    data: dataArr
                }
            }
        }
        
        done(null, item);
    });

    return 'index';
}

seneca.use(indexation);
seneca.use('repl', {port: 10023});
seneca.listen(4002);
seneca.client({port:4000, pin: 'wr:*'});