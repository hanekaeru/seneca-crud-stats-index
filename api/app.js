const Seneca = require('seneca')
const SenecaWeb = require('seneca-web')
const Express = require('express')
const seneca = Seneca()
const BodyParser = require('body-parser')

// cf. https://github.com/senecajs/seneca-web/blob/master/docs/providing-routes.md

/**
 * Création des différentes routes pour notre API.
 */
var Routes = [
{
    pin: 'role:web,target:stats',
    prefix: '/api/wr/stats',
    map: {
        // GET /api/wr/stats/:applicant?
        list: {
            GET: true,
            name: '',
            suffix: '/:applicant?'
        }
    }
},
{
    pin: 'role:web,target:wr',
    prefix : '/api/wr',
    map: {
        // GET /api/wr/:id
        list: {
            GET: true,
            name: '',
            suffix: '/:id?',
            postfix: '/?search=true'
        },
        // PUT /api/wr/:id
        edit: {
            PUT: true,
            name: '',
            suffix: '/:id?'
        },
        // POST /api/wr
        create: {
            POST: true,
            name: ''
        },
        // DELETE /api/wr/:id
        delete: {
            DELETE: true,
            name: '',
            suffix: '/:id?'
        }
    }
}]

seneca.use(SenecaWeb, {
    options: { parseBody: false }, // desactive l'analyseur JSON de Seneca
    routes: Routes,
    context: Express().use(BodyParser.json()),     // utilise le parser d'Express pour lire les donnees 
    adapter: require('seneca-web-adapter-express') // des requetes PUT
});

seneca.client({     // ce module enverra les messages counter:*
    port: 4000,     // sur le port 4000 (qui est le port sur lequel le microservice
    pin: 'wr:*'     // counter attend les messages...
});

seneca.client({     // ce module enverra les messages counter:*
    port: 4001,     // sur le port 4000 (qui est le port sur lequel le microservice
    pin: 'stats:*'     // counter attend les messages...
});

seneca.add('role:web,target:stats', function (msg, reply) {
    let data = msg.args.body;
    let params = msg.args.params;
    console.log('add target:stats:' + data);

    this.log.info({pattern: msg.args.route.pattern, data: data, params: params});

    /**
     * On analyse quelle a été la requête exécutée afin de pouvoir faire des
     * traitement personnalisé à chacun des types de requête.
     */
    switch (msg.request$.method) {

        // Si la méthode reçue est un GET, alors nous envoyons uniquement l'ID
        // si il a été spécifié au moment de la requête, on rappelle que ce 
        // paramètre est optionnel, sinon nous n'envoyons, dans les deux cas,
        // la commande list qui nous permet de dire que nous avons réalisé une
        // commande GET.
        case "GET":
            if(params.applicant !== undefined) {
                this.act({stats:'listapp'}, {
                    cmd: "list",
                    data: {
                        applicant: params.applicant
                    }
                }, reply);
            } else {
                this.act({stats:'list'}, {
                    cmd: "list"
                }, reply);
            }
            break;
    }
});

seneca.add('role:web,target:wr', function (msg, reply) {
    let data = msg.args.body;
    let params = msg.args.params;
    console.log('add target:wr:' + data);

    this.log.info({pattern: msg.args.route.pattern, data: data, params: params});

    /**
     * On analyse quelle a été la requête exécutée afin de pouvoir faire des
     * traitement personnalisé à chacun des types de requête.
     */
    switch (msg.request$.method) {
        // Si la méthode reçue est un POST, alors nous envoyons toutes les
        // informations que nous avons à notre disposition pour créer un nouveau
        // WR ainsi que la commande create.
        case "POST":
            this.act({wr:'post'}, {
                cmd: "create",
                data: {
                    applicant: data.applicant,
                    work: data.work,
                    dc_date: data.dc_date
                }
            }, reply);
            break;

        // Si la méthode reçue est un GET, alors nous envoyons uniquement l'ID
        // si il a été spécifié au moment de la requête, on rappelle que ce 
        // paramètre est optionnel, sinon nous n'envoyons, dans les deux cas,
        // la commande list qui nous permet de dire que nous avons réalisé une
        // commande GET.
        case "GET":
            if(params.id !== undefined) {
                this.act({wr:'listid'}, {
                    cmd: "list",
                    data: {
                        id: params.id,
                        err: msg.args.query
                    }
                }, reply)
            } else {
                if(Object.keys(msg.args.query).length === 0) {
                    this.act({wr:'list'}, {
                        cmd: "list"
                    }, reply)
                } else {
                    var key, value = null;
                    for(var i in msg.args.query){
                        key = i;
                        value = msg.args.query[i];
                    }
                    this.act({wr:'search'}, {
                        cmd: "search",
                        data: {
                            key: key,
                            value: value
                        }
                    }, reply);
                }
                
            }
            break;

        // Si la méthode reçue est un PUT, alors nous envoyons uniquement l'ID
        // ainsi que la commande update et les mises à jours qui nous permet de
        // dire que la dernière opération réalisée est un update.
        // Nous traitons également le cas, éroné, où un ID n'aurait pas été fourni
        // en spécifiant que l'ID est null.
        case "PUT":
            if(params.id !== undefined) {
                this.act({wr:'update'}, {
                    cmd: "update",
                    data: {
                        id: params.id,
                        updates: data
                    }
                }, reply);
            } else {
                this.act({wr:'update'}, {
                    cmd: "update", 
                    data: {
                        id: null
                    }
                }, reply);
            }
            break;

        // Si la méthode reçue est un DELETE, alors nous envoyons uniquement l'ID
        // ainsi que la commande delete qui nous permet de dire que la dernière
        // opération réalisée est un delete.
        case "DELETE":
            this.act({wr:'delete'}, {
                cmd: "delete",
                data: {
                    id: params.id
                }
            }, reply);
            break;
    }
});

// les requetes HTTP sont attendues sur le port 3000
// curl -H "Content-Type: application/json" -d {\"op\":\"inc\"} -X POST http://localhost:3000/counter
seneca.ready(() => {
  const app = seneca.export('web/context')()
  app.listen(3000)
});
