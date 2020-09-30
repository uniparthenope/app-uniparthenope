const observableModule = require("tns-core-modules/data/observable");
const ObservableArray = require("tns-core-modules/data/observable-array").ObservableArray;
const app = require("tns-core-modules/application");
const httpModule = require("tns-core-modules/http");
const dialogs = require("tns-core-modules/ui/dialogs");
const appSettings = require("tns-core-modules/application-settings");

let page;
let viewModel;
let sideDrawer;
let index = 0;

let departments = [{area: "TEST"}];
let prenotazioneServizi;
let lezioniList;
let loading;
let no_less;
let servizi;

 function onNavigatingTo(args) {
    page = args.object;


    no_less = page.getViewById("no_lession");
    loading = page.getViewById("activityIndicator");


    sideDrawer = app.getRootView();
    sideDrawer.closeDrawer();

    prenotazioneServizi = new ObservableArray();

     viewModel = observableModule.fromObject({
        prenotazioneServizi: prenotazioneServizi,
        departments: departments

    });
     console.log(global.services);
     departments = global.services;
     getAllServices();
    page.bindingContext = viewModel;
}
function showLession(index){
    loading.visibility = "visible";

    while(prenotazioneServizi.length > 0)
        prenotazioneServizi.pop();

    let result = departments[index].services;
    if(result.length === 0)
        no_less.visibility = "visible";
    else
        no_less.visibility = "collapsed";

    for (let i=0; i<result.length; i++){
        loading.visibility = "visible";

        let fulldata = convertData(result[i].start);
        fulldata = "" + dayOfWeek(fulldata) + " " + fulldata.getDate() + " " + monthOfYear(fulldata.getMonth()) + " " + fulldata.getFullYear();
        //console.log(fulldata);
        let start_data = convertData(result[i].start);
        let end_data = convertData(result[i].end);
        let max_cap = Math.floor(result[i].room.capacity);
        let rem_cap = max_cap - Math.floor(result[i].room.availability);

        let res;
        if (result[i].reservation.reserved)
            res = "visible";
        else
            res = "collapsed";

        prenotazioneServizi.push({
            "id": result[i].id,
            "classe": "examPass",
            "nome": fulldata,
            "start": ""+ start_data.getHours() + ":"+ convertMinutes(start_data.getMinutes()),
            "end": ""+ end_data.getHours() + ":"+convertMinutes(end_data.getMinutes()),
            "room": result[i].room.name,
            "room_place": result[i].room.description,
            "capacity": max_cap + " Posti",
            "availability":rem_cap + "/",
            "max_c" : max_cap,
            "ava_c" : rem_cap,
            "res" : res,
            "isReserved": result[i].reservation.reserved,
            "reserved_by": result[i].reservation.reserved_by,
            "reserved_id": result[i].reservation.reserved_id
        });
        prenotazioneServizi.sort(function (orderA, orderB) {
            let nameA = orderA.nome;
            let nameB = orderB.nome;
            return (nameA < nameB) ? -1 : (nameA > nameB) ? 1 : 0;
        });
    }
    loading.visibility = "collapsed";
}

function onDrawerButtonTap() {
    const sideDrawer = app.getRootView();
    sideDrawer.showDrawer();
}

function onGeneralMenu(){
    const nav =
        {
            moduleName: "home/home-page",
            clearHistory: true
        };
    page.frame.navigate(nav);
}

function onItemTap(args) {
    const index = args.index;

    let lez = prenotazioneServizi.getItem(index);

    if(lez.isReserved){
        dialogs.confirm({
            title: "Cancellazione posto",
            message: "Sicuro di voler cancellare la prenotazione ad un posto?",
            okButtonText: "Sì",
            cancelButtonText: "No",
        }).then(function (result) {
            if (result){
                httpModule.request({
                    url: global.url_general + "GAUniparthenope/v1/Reservations/" + lez.reserved_id,
                    method: "DELETE",
                    headers: {
                        "Content-Type" : "application/json",
                        "Authorization" : "Basic " + global.encodedStr
                    }
                }).then((response) => {
                    const result = response.content.toJSON();

                    if (response.statusCode === 200){
                        global.updatedExam = false;
                        dialogs.alert({
                            title: "Successo",
                            message: result["status"],
                            okButtonText: "OK"
                        }).then(function (){
                            const nav =
                                {
                                    moduleName: "prenotazione-servizi/prenotazione-servizi",
                                    clearHistory: true
                                };
                            page.frame.navigate(nav);
                        });
                    }
                    else{
                        dialogs.alert({
                            title: "Errore: Cancellazione Prenotazioni",
                            message: result['message'],
                            okButtonText: "OK"
                        });
                    }

                },(e) => {
                    console.log("QUI");
                    console.log("Error", e);
                    dialogs.alert({
                        title: "Errore: Cancellazione prenotazioni",
                        message: e.toString(),
                        okButtonText: "OK"
                    });
                });
            }
        });
    }
    else{
        dialogs.confirm({
            title: "Prenotazione posto",
            message: "Sicuro di voler prenotare un posto?",
            okButtonText: "Sì",
            cancelButtonText: "No",
        }).then(function (result) {
            console.log(result);
            if (result){
                httpModule.request({
                    url : global.url_general + "GAUniparthenope/v1/ServicesReservation",
                    method: "POST",
                    headers: {
                        "Content-Type" : "application/json",
                        "Authorization" : "Basic " + global.encodedStr
                    },
                    content : JSON.stringify({
                        id_entry: lez.id.toString(),
                        matricola: appSettings.getString("matricola", ""),
                    })
                }).then((response) => {
                    const result = response.content.toJSON();

                    if (response.statusCode === 200){
                        dialogs.alert({
                            title: "Successo",
                            message: result["status"],
                            okButtonText: "OK"
                        }).then(function (){
                            const nav =
                                {
                                    moduleName: "prenotazione-servizi/prenotazione-servizi",
                                    clearHistory: true
                                };
                            page.frame.navigate(nav);
                        });
                    }
                    else{
                        dialogs.alert({
                            title: "Errore: Prenotazioni",
                            message: result["errMsg"],
                            okButtonText: "OK"
                        });
                    }

                },(e) => {
                    console.log("Error", e);
                    dialogs.alert({
                        title: "Errore: prenotazioni",
                        message: e.toString(),
                        okButtonText: "OK"
                    });
                });
            }
        });
    }

}
exports.onItemTap = onItemTap;

exports.onGeneralMenu = onGeneralMenu;
exports.onNavigatingTo = onNavigatingTo;
exports.onDrawerButtonTap = onDrawerButtonTap;

function dayOfWeek(date) {
    date = date.getDay();
    return isNaN(date) ? null : ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'][date];

}

function monthOfYear(date) {

    return isNaN(date) ? null : ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"][date];

}
function convertMinutes(data) {

    if(data < 10)
        return data + "0";
    else
        return data;

}
function convertData(data){

    let day = data[8]+data[9];
    let month = data[5]+data[6];
    let year = data[0]+data[1]+data[2]+data[3];
    let hour = data[11]+data[12];
    let min = data[14]+data[15];

    let d = new Date(year,month-1,day,hour,min);

    return d;
}
function onListPickerLoaded(fargs) {
    const listPickerComponent = fargs.object;
    listPickerComponent.on("selectedIndexChange", (args) => {

        const picker = args.object;
        index = picker.selectedIndex;
        showLession(index);
    });
}
exports.onListPickerLoaded = onListPickerLoaded;

function getAllServices(){
    loading.visibility = "visible";
    let url = global.url_general + "GAUniparthenope/v1/getTodayServices";
    //loading.visibility = "visible";
    httpModule.request({
        url: url,
        method: "GET",
        headers: {
            "Content-Type" : "application/json",
            "Authorization" : "Basic "+ global.encodedStr
        }
    }).then((response) => {
        departments = response.content.toJSON();
        let t = page.getViewById("listpicker");
        //t.item(departments);
        showLession(0); //Show default lession
        loading.visibility = "collapsed";
    },(e) => {
        console.log("Error", e);
        loading.visibility = "collapsed";

        dialogs.alert({
            title: "Errore: prenotazioni",
            message: e.toString(),
            okButtonText: "OK"
        });
    });
}