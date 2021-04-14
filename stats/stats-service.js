const Seneca = require('seneca');
var seneca = Seneca();

var statistics = function(options) {

    // GET
    this.add('stats:list', function(msg, done) {
        // Améliorer en message asynchrone.
        this.act('wr:status', function(err, result) {

            if(err) console.log(err);
            var nb_created = result.data.length;
            var nb_deleted = 0;
            var nb_closed = 0;
            var nb_opened = 0;

            for(i = 0; i < result.data.length; i++) {
                switch (result.data[i].state) {
                    case "deleted":
                        nb_deleted++;
                        break;
                    case "closed":
                        nb_closed++;
                        break;
                }
            }
            
            nb_opened = nb_created - nb_deleted - nb_closed;

            //console.log("Open: " + nb_opened + "Created: " + nb_created + "Deleted: " + nb_deleted + "Closed: " + nb_closed)

            let item = {
                success: true,
                data: {
                    global_stats_wr_created: nb_created,
                    global_stats_wr_opened: nb_opened,
                    global_stats_wr_closed: nb_closed
                }
            };
            done(null, item); 
        });
    });

    // GET ID
    this.add('stats:listapp', function(msg, done) {
        // Améliorer en message asynchrone.
        var concernedApplicant = msg.data.applicant;
        // Améliorer en message asynchrone.
        this.act('wr:status', function(err, result) {

            if(err) console.log(err);
            var nb_created = 0;
            var nb_deleted = 0;
            var nb_closed = 0;
            var nb_opened = 0;

            for(i = 0; i < result.data.length; i++) {
                if(result.data[i].applicant == concernedApplicant) {
                    nb_created++;
                    switch (result.data[i].state) {
                        case "deleted":
                            nb_deleted++;
                            break;
                        case "closed":
                            nb_closed++;
                            break;
                    }
                }
            }
            
            nb_opened = nb_created - nb_deleted - nb_closed;

            let item = {
                success: true,
                data: {
                    applicant: concernedApplicant,
                    stats_wr_created: nb_created,
                    stats_wr_opened: nb_opened,
                    stats_wr_closed: nb_closed
                }
            };
            done(null, item); 
        });
    });


    return 'stats';
}

seneca.use(statistics);
seneca.use('repl', {port: 10022});
seneca.listen(4001);
seneca.client({port:4000, pin: 'wr:*'});