const observableModule = require("tns-core-modules/data/observable");
const ObservableArray = require("tns-core-modules/data/observable-array").ObservableArray;
const app = require("tns-core-modules/application");
const httpModule = require("tns-core-modules/http");
const dialogs = require("tns-core-modules/ui/dialogs");
const appSettings = require("tns-core-modules/application-settings");
const modalViewModule = "docenti/modal-studentiLezione/modal-studentiLezione";
const frame = require("tns-core-modules/ui/frame");


let page;
let viewModel;
let sideDrawer;
let index = 0;

let courses = global.myExams;
let docentiLezioni;
let lezioniList;
let loading;
let no_less;
let lezioni;

function onNavigatingTo(args) {
    page = args.object;

    docentiLezioni = new ObservableArray();

    viewModel = observableModule.fromObject({
        courses: courses,
        docentiLezioni: docentiLezioni
    });

    no_less = page.getViewById("no_lession");
    loading = page.getViewById("activityIndicator");

    sideDrawer = app.getRootView();
    sideDrawer.closeDrawer();

    getLectures();
    page.getViewById("selected_col").col = "4";
    global.getAllBadge(page);


    page.bindingContext = viewModel;
}

function getLectures(){
    let anno = appSettings.getString("aa_accad").split(" - ")[0];

    let url = global.url_general + "GAUniparthenope/v1/getProfLectures/"+ anno;
    loading.visibility = "visible";

    httpModule.request({
        url: url,
        method: "GET",
        headers: {
            "Content-Type" : "application/json",
            "Authorization" : "Basic "+ global.encodedStr
        }
    }).then((response) => {
        lezioni = response.content.toJSON();
        showLession(0);
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
function showLession(index){
    loading.visibility = "visible";

    while(docentiLezioni.length > 0)
        docentiLezioni.pop();

    let result = lezioni[index].courses;
    console.log(result);
    if(result.length === 0)
        no_less.visibility = "visible";
    else
        no_less.visibility = "collapsed";

    for (let i=0; i<result.length; i++){
        loading.visibility = "visible";

        let fulldata = convertData(result[i].start);
        fulldata = "" + dayOfWeek(fulldata) + " " + fulldata.getDate() + " " + monthOfYear(fulldata.getMonth()) + " " + fulldata.getFullYear();
        let start_data = convertData(result[i].start);
        let end_data = convertData(result[i].end);
        let max_cap = Math.floor(result[i].room.capacity);
        let rem_cap = max_cap - Math.floor(result[i].room.availability);

        docentiLezioni.push({
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
        });
        docentiLezioni.sort(function (orderA, orderB) {
            let nameA = orderA.fulldata;
            let nameB = orderB.fulldata;
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

function onItemTap(args){
    const mainView = args.object;
    const index = args.index;
    //console.log(docentiLezioni.getItem(index).id);
    const option = {
        context: {data: docentiLezioni.getItem(index).nome, id: docentiLezioni.getItem(index).id },
        closeCallback: () => {
            // Receive data from the modal view. e.g. username & password
            const nav =
                {
                    moduleName: "docenti/docenti-lezioni/docenti-lezioni",
                    clearHistory: true,
                    animated: false
                };
            page.frame.navigate(nav);
        },
        fullscreen: false
    };

    mainView.showModal(modalViewModule, option);
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

exports.tapCourses = function(){
    const nav =
        {
            moduleName: "docenti/docenti-corsi/docenti-corsi",
            clearHistory: true,
            animated: false
        };
    page.frame.navigate(nav);
};

exports.tapAppello = function(){
    const nav =
        {
            moduleName: "docenti/docenti-appelli/docenti-appelli",
            clearHistory: true,
            animated: false
        };
    frame.Frame.topmost().navigate(nav);

};

exports.tapCalendar = function(){
    const nav =
        {
            moduleName: "docenti/docenti-home/docenti-home",
            clearHistory: true,
            animated: false
        };
    frame.Frame.topmost().navigate(nav);
};