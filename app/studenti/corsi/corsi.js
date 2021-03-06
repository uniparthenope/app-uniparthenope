const app = require("tns-core-modules/application");
const appSettings = require("tns-core-modules/application-settings");
const ObservableArray = require("tns-core-modules/data/observable-array").ObservableArray;
const Observable = require("tns-core-modules/data/observable");
const frame = require("tns-core-modules/ui/frame");

let page;
let sideDrawer;
let items;
let esamiList;

function drawTitle() {
    if (appSettings.getString("aa_accad") !== undefined)
        page.getViewById("aa").text = L('my_courses_aa') + appSettings.getString("aa_accad") + " - " + (parseInt(appSettings.getString("aa_accad"))+1);

    else
    {
        console.log("CORSI.AA_ACCAD = undefined (A.A non recuperato!)");
        page.getViewById("aa").text = L('my_courses_aa_avail');
    }

    if (appSettings.getString("semestre") !== undefined)
        page.getViewById("semestre").text = appSettings.getString("semestre");
    else
    {
        console.log("CORSI.SEMESTRE = undefined (Semestre non recuperato!)");
        page.getViewById("semestre").text = L('my_courses_sem_avail');
    }
}

function drawYear(year) {
    if (year === 1)
        return "I";
    else if (year === 2)
        return "II";
    else if (year === 3)
        return "III";
    else
        return "SCE";
}

function getCourses() {
    let courses = global.myExams;
    const act_sem = appSettings.getString("semestre");

    //console.log(courses);
    for (let i=0; i<courses.length; i++)
    {
        let partizione = courses[i].domPartCod;
        if (partizione === '')
            partizione = L('my_courses_partition_value');
        //console.log(courses[i].tipo);
        if (courses[i].tipo === 'V')
            if (courses[i].esito === 'P' || courses[i].esito === 'F')
                items.push({
                    "anno": drawYear(courses[i].annoId),
                    "esame": courses[i].nome,
                    "prof": courses[i].docente,
                    //"data_inizio": "Dal " + courses[i].inizio,
                    //"data_fine": " al " + courses[i].fine,
                    //"ult_mod": courses[i].modifica,
                    "adLogId": courses[i].adLogId,
                    "partizione": L('my_courses_partition') + partizione
                });
        //esamiList.refresh();

        items.sort(function (orderA, orderB) {
            let nameA = orderA.anno;
            let nameB = orderB.anno;
            return (nameA > nameB) ? 1 : (nameA < nameB) ? -1 : 0;
        });
        /*
        if (act_sem === "Secondo Semestre" && (courses[i].semestre === "S2" ||courses[i].semestre === "A2" || courses[i].semestre === "N/A"))
        {
            items.push({
                "anno": drawYear(courses[i].annoId),
                "esame": courses[i].nome,
                "prof": courses[i].docente,
                "data_inizio": "Dal " + courses[i].inizio,
                "data_fine": " al " + courses[i].fine,
                "ult_mod": courses[i].modifica,
                "adLogId": courses[i].adLogId
            });
            esamiList.refresh();
            x++;
        }
        else if (act_sem === "Primo Semestre" && (courses[i].semestre === "S1" || courses[i].semestre === "A1" || courses[i].semestre === "N/A"))
        {
            items.push({
                "anno": drawYear(courses[i].annoId),
                "esame": courses[i].nome,
                "prof": courses[i].docente,
                "data_inizio": "Dal " + courses[i].inizio,
                "data_fine": " al " + courses[i].fine,
                "ult_mod": courses[i].modifica,
                "adLogId": courses[i].adLogId
            });
            esamiList.refresh();
            x++;
        }
        else if (act_sem === undefined){
            items.push({
                "anno": drawYear(courses[i].annoId),
                "esame": courses[i].nome,
                "prof": courses[i].docente,
                "data_inizio": "Dal " + courses[i].inizio,
                "data_fine": " al " + courses[i].fine,
                "ult_mod": courses[i].modifica,
                "adLogId": courses[i].adLogId
            });
            esamiList.refresh();
            x++;
        }
        else
        {
            console.log(courses[i].nome + " :Esame non aggiunto al semestre attuale!!");
        }


         */
    }

    appSettings.setNumber("examsBadge",items.length);
}

exports.onNavigatingTo = function(args) {
    page = args.object;
    sideDrawer = app.getRootView();
    sideDrawer.closeDrawer();
    drawTitle();

    page.getViewById("selected_col").col = "1";

    items = new ObservableArray();
    esamiList = page.getViewById("listview");
    let viewModel = Observable.fromObject({
        items:items
    });

    getCourses();

    global.getAllBadge(page);
    page.bindingContext = viewModel;
}

exports.onDrawerButtonTap = function() {
    const sideDrawer = app.getRootView();
    sideDrawer.showDrawer();
}

exports.onItemTap = function(args) {
    const mainView = args.object;
    const index = args.index;

    //TODO Dettagli Corsi
    //const adLogId = { adLogId: items.getItem(index).adLogId, esame: items.getItem(index).esame, docente: items.getItem(index).docente};

    //mainView.showModal(modalViewModule, adLogId, false);
}

exports.tapLibretto = function(){
    const nav =
        {
            moduleName: "studenti/libretto/libretto",
            clearHistory: true,
            animated: false
        };
    frame.Frame.topmost().navigate(nav);
};

exports.tapAppello = function(){
    const nav =
        {
            moduleName: "studenti/prenotazioni/prenotazioni",
            clearHistory: true,
            animated: false
        };
    frame.Frame.topmost().navigate(nav);
};

exports.tapCalendar = function(){
    const nav =
        {
            moduleName: "studenti/userCalendar/userCalendar",
            clearHistory: true,
            animated: false
        };
    frame.Frame.topmost().navigate(nav);
};

exports.onGeneralMenu = function () {
    const nav =
        {
            moduleName: "general/home/home-page",
            clearHistory: true
        };
    page.frame.navigate(nav);
}