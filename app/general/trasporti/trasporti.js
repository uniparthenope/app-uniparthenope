let geolocation = require("nativescript-geolocation");
const observableModule = require("tns-core-modules/data/observable");
const app = require("tns-core-modules/application");
const dialogs = require("tns-core-modules/ui/dialogs");
const appSettings = require("tns-core-modules/application-settings");
const nativescript_webview_interface_1 = require("nativescript-webview-interface");
const httpModule = require("tns-core-modules/http");
let device = require("tns-core-modules/platform");
let application = require("tns-core-modules/application");
let timer = require("tns-core-modules/timer");
let timer_id;
let myposition_id;
let bus_timer;

let page;
let grpDes = appSettings.getString("grpDes");
let viewModel;
let sideDrawer;
let oLangWebViewInterface;
let array_locations = [{id:'CDN', name: 'Centro Direzionale', lat: 40.856831, long: 14.284553, sede_1:"Via Acton", sede_2:"Via Medina", sede_3:"Via Parisi", sede_4:"Villa Doria"},
                        {id:'Acton',name: 'Via Acton', lat: 40.837372, long: 14.253502, sede_1:"Centro Direzionale", sede_2:"Via Medina", sede_3:"Via Parisi", sede_4:"Villa Doria"},
                        {id:'Medina',name: 'Via Medina', lat: 40.840447, long: 14.251863, sede_1:"Via Acton", sede_2:"Centro Direzionale", sede_3:"Via Parisi", sede_4:"Villa Doria"},
                        {id:'Parisi',name: 'Via Parisi', lat: 40.832308, long: 14.245027, sede_1:"Via Acton", sede_2:"Via Medina", sede_3:"Centro Direzionale", sede_4:"Villa Doria"},
                        {id:'Villa',name: 'Villa Doria', lat: 40.823872, long: 14.216225, sede_1:"Via Acton", sede_2:"Via Medina", sede_3:"Via Parisi", sede_4:"Centro Direzionale"}];

function setupWebViewInterface(page){
    let webView = page.getViewById('webView');
    oLangWebViewInterface = new nativescript_webview_interface_1.WebViewInterface(webView, '~/www/index.html');
}

function loadGraphic(id){
    page.getViewById("sede").text = L('trasp_error');

    for (let i = 0; i < array_locations.length; i++) {
        if (array_locations[i].id === id){
            page.getViewById("sede").text = L('transp_act') + " " + array_locations[i].name;
            page.getViewById("sede_1").text = array_locations[i].sede_1;
            page.getViewById("sede_2").text = array_locations[i].sede_2;
            page.getViewById("sede_3").text = array_locations[i].sede_3;
            page.getViewById("sede_4").text = array_locations[i].sede_4;
            page.getViewById("sede_1").visibility = "visible";
            page.getViewById("sede_2").visibility = "visible";
            page.getViewById("sede_3").visibility = "visible";
            page.getViewById("sede_4").visibility = "visible";

        }

    }
}

function getBusPosition() {
    httpModule.request({
        url: global.url_general + "Bus/v1/bus/CDN",
        method: "GET",
        headers: {
            "Content-Type" : "application/json"}
    }).then((response) => {
        const result = response.content.toJSON();

        if (response.statusCode === 500) {
            dialogs.alert({
                title: "Errore: Trasporti getBusPosition",
                message: result.errMsg,
                okButtonText: "OK"

            });
        } else {
            bus_timer = setTimeout(function () {
                oLangWebViewInterface.emit('bus', {bus: result});
            }, 800);
        }

    }, (e) => {
        console.log("Error", e.retErrMsg);
        dialogs.alert({
            title: "Errore: Trasporti",
            message: e.toString(),
            okButtonText: "OK"
        });
    });
}

if(device.isAndroid){
    application.android.on(application.AndroidApplication.activityBackPressedEvent, (args) => {
        console.log("Interrompo servizi GPS...");
        timer.clearInterval(timer_id);
        clearTimeout(bus_timer);

        oLangWebViewInterface.destroy();
        geolocation.clearWatch(myposition_id);
    });
}

exports.pageLoaded = function(args) {
    page = args.object;
    viewModel = observableModule.fromObject({ });
    sideDrawer = app.getRootView();
    sideDrawer.closeDrawer();

    dialogs.alert({
        title: L('warning'),
        message: L('transp_warn'),
        okButtonText: "OK"
    });
    setupWebViewInterface(page);

    //Imposto la posizione attuale e la legenda in basso
    let name_pos = appSettings.getString("position");
    loadGraphic(name_pos);

    geolocation.enableLocationRequest().then(function () {
        geolocation.isEnabled().then(function (isEnabled) {
            myposition_id = geolocation.watchLocation(
                function (loc) {
                    if (loc) {
                        let latitudine = (loc.latitude).toString();
                        let longitudine = (loc.longitude).toString();
                        console.log("Live POSITION =" + latitudine.toString() + " " + longitudine.toString());
                        setTimeout(function () {
                            oLangWebViewInterface.emit('location', {lat: latitudine, lang: longitudine});
                        }, 800);
                    }
                },
                function (e) {
                    console.log("Error: " + e.message);
                    dialogs.alert({
                        title: "Errore: Trasporti watchLocation",
                        message: e.message,
                        okButtonText: "OK"
                    });
                },
                {desiredAccuracy: 3, updateDistance: 10, minimumUpdateTime: 1000 * 2});
        })
    });
    getBusPosition();
    timer_id = timer.setInterval(() => {
        console.log("Timer....");
        getBusPosition();
    }, 10000);


    page.bindingContext = viewModel;
}

exports.onNavigatingFrom = function() {
    console.log("Interrompo servizi GPS...");
    timer.clearInterval(timer_id);
    clearTimeout(bus_timer);

    oLangWebViewInterface.destroy();
    geolocation.clearWatch(myposition_id);
}

exports.onDrawerButtonTap = function() {
    const sideDrawer = app.getRootView();
    sideDrawer.showDrawer();
}

exports.onGeneralMenu = function() {
    console.log("Interrompo servizi GPS...");
    timer.clearInterval(timer_id);
    oLangWebViewInterface.destroy();
    geolocation.clearWatch(myposition_id);
    const nav =
        {
            moduleName: "home/home-page",
            clearHistory: true
        };
    page.frame.navigate(nav);
}
