const Seneca = require('seneca');

var seneca = Seneca();

var values = [];
var status = [];

var workrequest = function(options) {
    // CREATE
    this.add('wr:post', function(msg, done) {
        idForInsert = findHighestIdValue();
        let item;
        if(msg.data.dc_date !== undefined && msg.data.applicant !== undefined) {
            item = {
                success: true,
                data: [{
                    applicant: msg.data.applicant,
                    work: msg.data.work,
                    dc_date: msg.data.dc_date,
                    id: idForInsert,
                    state: "created"
                }],
                cmd: msg.cmd
            }
            // On ajoute à notre status une WR created.
            status.push({id: item.data[0].id, applicant: item.data[0].applicant, state: "created"});
            values.push(item);
        } else {
            item = {
                success: false
            }
        }
        
        done(null, item);
    });

    // GET ID
    this.add('wr:listid', function(msg, done) {
        let item = values.filter(value => value.data[0].id == msg.data.id)[0];
        item.cmd = msg.cmd;
        done(null, item);
    });

    // GET
    this.add('wr:list', function(msg, done) {
        allWRInformations = [];
        values.forEach(element => allWRInformations.push(element.data[0]));
        let item = {
            success: true,
            data: allWRInformations
        };
        done(null, item);
    });

    this.add('wr:status', function(msg, done) {
        allStatus = [];
        status.forEach(element => allStatus.push(element));
        let item = {
            data: allStatus
        };
        done(null, item);
    });

    // PUT
    this.add('wr:update', function(msg, done) {
        if(msg.data.id == null) {
            let item = {
                success: false,
                msg: "wr id not provided"
            }
            done(null, item);
        } else {
            let item = values.filter(value => value.data[0].id == msg.data.id)[0];
            if(!item) {
                done(null, {success:false, msg:"wr not found"});
            } else {
                removeElement(values, item);
                if(item.data[0].state == "created") {
                    item.cmd = msg.cmd;
                    item.data[0].work = msg.data.updates.work || item.data[0].work;
                    if(msg.data.updates.state == "closed") {
                        let updated_status = status.filter(value => value.id == msg.data.id)[0];
                        removeElement(status, updated_status);
                        // On ajoute à notre status une WR created.
                        status.push({id: item.data[0].id, applicant: item.data[0].applicant, state: "closed"});
                        item.data[0].state = msg.data.updates.state || item.data[0].state;
                        item.data[0].compl_date = currentDate();
                    }
                } else {
                    item.success = false;
                    item.msg = "wr is already closed";
                }
                values.push(item);
                done(null, item);
            } 
        } 
    });

    // DELETE
    this.add('wr:delete', function(msg, done) {
        if(msg.data.id == undefined) {
            var new_wr = []
            for(i = 0; i < values.length; i++) {
                if(values[i].data[0].state === "closed") {
                    new_wr.push(values[i])
                } else {
                    let updated_status = status.filter(value => value.id == values[i].data[0].id)[0];
                    removeElement(status, updated_status);
                    // On ajoute à notre status une WR created.
                    status.push({id: values[i].data[0].id, applicant: values[i].data[0].applicant, state: "deleted"});
                }
            }
            values = new_wr;
            done(null, {success: true});
        } else {
            let item = values.filter(value => value.data[0].id == msg.data.id)[0];
            if(!item) {
                done(null, {success:false, msg:"wr not found"});
            }
            removeElement(values, item);
            if(item.data[0].state === "created") {
                item.success = true;
                let updated_status = status.filter(value => value.id == msg.data.id)[0];
                removeElement(status, updated_status);
                // On ajoute à notre status une WR created.
                status.push({id: item.data[0].id, applicant: item.data[0].applicant, state: "deleted"});
            } else {
                item.success = false;
                item.msg = "wr is already closed";
            }
            values.push(item);
            done(null, item);
        }
    })

    return 'wr';
}

/**
 * Fonction qui permet de retourner une chaîne de caractères 
 * contenant la date au format numérique classique du jour.s
 * @returns today Date du jour
 */
function currentDate() {
    let today = new Date();
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0');
    let yyyy = today.getFullYear();

    today = mm + '/' + dd + '/' + yyyy;
    return today;
}

/**
 * Fonction qui va permettre de supprimer un élément dans un tableau.
 * @param {*} array Tableau dans lequel on souhaite supprimer un élément.
 * @param {*} elem Element que l'on souhaite supprimer dans le tableau.
 */
function removeElement(array, elem) {
    var index = array.indexOf(elem);
    if (index > -1) {
        array.splice(index, 1);
    }
}

/**
 * Fonction qui permet de retourner le plus grand ID présent
 * dans notre liste de WR. Il sera utilisé lors de chaque requête
 * POST notamment pour auto-incrémenter les ID.
 * @returns values.length+1
 */
function findHighestIdValue() {
    return values.length + 1;
}

seneca.use(workrequest);
seneca.use('repl', {port: 10021});
seneca.listen(4000);