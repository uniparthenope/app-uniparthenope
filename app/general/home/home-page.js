const observableModule = require("tns-core-modules/data/observable");
const app = require("tns-core-modules/application");
const appSettings = require("tns-core-modules/application-settings");
let geolocation = require("nativescript-geolocation");
const httpModule = require("http");
const utilsModule = require("tns-core-modules/utils/utils");
const dialogs = require("tns-core-modules/ui/dialogs");
let appversion = require("nativescript-appversion");
const modalViewModule = "modal/modal-meteo/modal-meteo";
const appRater = require("nativescript-rater").appRater;
let firebase = require("nativescript-plugin-firebase");
const ObservableArray = require("tns-core-modules/data/observable-array").ObservableArray;



let page;
let viewModel;
let sideDrawer;
let remember;
let user;
let pos;
let indicator;
let news;

let array_locations = [{id: 'CDN', lat: 40.856831, long: 14.284553, color: 'linear-gradient(135deg, #5CC77A, #009432)', background:'linear-gradient(180deg, rgba(0, 0, 0, 0), rgb(0, 167, 84))'},
    {id: 'Medina', lat: 40.840447, long: 14.251863, color: 'linear-gradient(135deg, #107dd0, #22384f)', background:'linear-gradient(180deg, rgba(0, 0, 0, 0), rgb(221, 108, 166))'},
    {id: 'Acton', lat: 40.837372, long: 14.253502, color: 'linear-gradient(135deg, #107dd0, #22384f)', background:'linear-gradient(180deg, rgba(0, 0, 0, 0), rgb(11, 114, 181))'},
    {id: 'Parisi', lat: 40.832308, long: 14.245027, color: 'linear-gradient(135deg, #107dd0, #22384f)', background:'linear-gradient(180deg, rgba(0, 0, 0, 0), rgb(119, 72, 150))'},
    {id: 'Villa', lat: 40.823872, long: 14.216225, color: 'linear-gradient(135deg, #107dd0, #22384f)', background:'linear-gradient(180deg, rgba(0, 0, 0, 0), rgb(36, 36, 36))'}];

function getNews(){
    let loading = page.getViewById("activityNews");
    //loading.visibility = "visible";

    httpModule.request({
        url: global.url + "general/avvisi/3",
        method: "GET"
    }).then((response) => {
        const result = response.content.toJSON();

        if (response.statusCode === 401 || response.statusCode === 500)
        {
            dialogs.alert({
                title: "Errore: Notizie getNotifications",
                message: result.errMsg,
                okButtonText: "OK"

            });
        }
        else {
            console.log(result.length);

            for (let i=0; i<result.length; i++) {

                news.push({
                    title: result[i].titolo,
                    body: result[i].abstract
                });
            }
            loading.visibility = "collapsed";
        }
    },(e) => {
        console.log("Error", e);
        dialogs.alert({
            title: "Errore: Notizie",
            message: e.toString(),
            okButtonText: "OK"
        });
    });
}


function checkServer(timeout){
    httpModule.request({
        url: global.url_general,
        method: "GET",
        timeout: timeout
    }).then((response) => {
        if (response.statusCode !== 200){
            console.log("SERVER DOWN");
            dialogs.alert({
                title: "Errore Server!",
                message: "Il server è attualmente in manutenzione e le principali operazioni potrebbero non essere disponibili.\nCi scusiamo per il disagio!",
                okButtonText: "OK"
            });
        }
        else
            console.log("SERVER OK");

    },(e) => {

        dialogs.alert({
            title: "Errore Server!",
            message: "TIMEOUT\nIl server è attualmente in manutenzione e le principali operazioni potrebbero non essere disponibili.\nCi scusiamo per il disagio!",
            okButtonText: "OK"
        });
    });
}

function rateApp() {
    appRater.showRateDialogIfMeetsConditions();
}

function getDepartment(studId) {
    console.log(studId);
    httpModule.request({
        url: global.url + "students/departmentInfo/"+ studId,
        method: "GET",
        headers: {
            "Content-Type" : "application/json",
            "Authorization" : "Basic "+ global.encodedStr
        }
    }).then((response) => {
        let _result = response.content.toJSON();
        //TODO gestire errori result
        global.saveDepartment(_result);

    },(e) => {
        console.log("Error", e);
        dialogs.alert({
            title: "Errore: Home getDepartment",
            message: e.toString(),
            okButtonText: "OK"
        });
    });
}

function calculateDistance(position) {
    let closer = "None";

    let bottom_bar = page.getViewById("bottom_bar");
    let bottom_bar2 = page.getViewById("bottom_bar2");

    let image = page.getViewById("main_image");


    for (let i = 0; i < array_locations.length; i++) {
        let loc = new geolocation.Location();
        loc.latitude = array_locations[i].lat;
        loc.longitude = array_locations[i].long;
        //console.log("Distanza= "+geolocation.distance(position,loc));
        if (geolocation.distance(position, loc) < 300) {
            //console.log("Trovata!");
            closer = array_locations[i].id;
            bottom_bar.background = array_locations[i].color;
            bottom_bar2.background = array_locations[i].color;

            image.src = '~/images/image_' + array_locations[i].id + ".jpg";

        }

    }
    return closer;
}

function getPosition(){
    try {

        geolocation.enableLocationRequest().then(function () {
            geolocation.isEnabled().then(function (isEnabled) {
                if(isEnabled){

                    geolocation.getCurrentLocation({desiredAccuracy: 3, updateDistance: 10, maximumAge: 10000, timeout: 10000}).
                    then(function(loc) {
                        console.log("Finding "+loc);
                        if (loc) {
                            pos = loc;
                            let position = calculateDistance(loc);
                            appSettings.setString("position", position);
                            console.log("MY_POSITION = "+loc.latitude+ " "+loc.longitude);
                        }
                        else { console.log("MY_POSITION = ERROR ");}
                    }, function(e){

                        console.log("Position Error: " + e.message);
                    });

                }
                else
                    console.log("NOT ENABLED");

            })
        });

    }
    catch (e){
        console.log(e);
    }

}

function detailedProf(docenteId) {
    httpModule.request({
        url: global.url + "professor/detailedInfo/"+ docenteId,
        method: "GET",
        headers: {
            "Content-Type" : "application/json",
            "Authorization" : "Basic "+ global.encodedStr
        }
    }).then((response) => {
        let _result = response.content.toJSON();
        //TODO Gestire errori result
        //console.log(_result);
        global.saveProf(_result);

    },(e) => {
        dialogs.alert({
            title: "Errore: Home detailedProf",
            message: e.toString(),
            okButtonText: "OK"
        });
    });
}

function setAnagrafe(id, type){
    httpModule.request({
        url: global.url + "general/anagrafica/"+ id,
        method: "GET",
        headers: {
            "Content-Type" : "application/json",
            "Authorization" : "Basic "+ global.encodedStr
        }
    }).then((response) => {
        let _result = response.content.toJSON();
        //TODO gestire errori result
        //console.log(_result);
        global.saveAnagrafe(type,_result);
        console.log("MI SPOSTO ...");
        let navigator = "";
        if(type === "Studenti")
            navigator = "studenti/userCalendar/userCalendar";
        else if(type === "Docenti")
            navigator = "docenti/docenti-home/docenti-home";
        else
            navigator = "general/home/home-page";

        indicator.visibility = "collapsed";

        const nav =
            {
                moduleName: navigator,
                clearHistory: true
            };
        page.frame.navigate(nav);

    },(e) => {
        console.log("Errore Anagrafe", e);
        dialogs.alert({
            title: "Errore: Home getAnagrafe",
            message: e.toString(),
            okButtonText: "OK"
        });
    });
}

function getPIC(personId, value) {
    let url;
    switch (value) {
        case 0:
            url = global.url + "general/image/" + personId;
            break;

        case 1:
            url = global.url + "general/image_prof/" + personId;
            break;
    }
    console.log(value);
    console.log(url);
    httpModule.getFile({
        "url": url,
        "method": "GET",
        headers: {
            "Content-Type": "image/jpg",
            "Authorization": "Basic " + global.encodedStr
        },
        "dontFollowRedirects": true
    }).then((source) => {
        sideDrawer.getViewById("topImg").backgroundImage = source["path"];
    }, (e) => {
        console.log("[Photo] Error", e);
        dialogs.alert({
            title: "Errore: Home getPic",
            message: e.toString(),
            okButtonText: "OK"
        });
    });
}

function setSideMenu(type,username) {
    let actualForm = sideDrawer.getViewById(type);
    let loginForm = sideDrawer.getViewById("loginForm");
    loginForm.visibility = "collapsed";
    actualForm.visibility = "visible";
    global.myform = type;

    sideDrawer.getViewById("topName").text = username;
    global.username = username;

    if(type === "userForm"){
        sideDrawer.getViewById("topMatr").text = appSettings.getString("matricola");
        sideDrawer.getViewById("topEmail").text = appSettings.getString("emailAte");
        sideDrawer.getViewById("topMatr").visibility = "visible";
        sideDrawer.getViewById("topEmail").visibility = "visible";
        getPIC(appSettings.getNumber("persId"),0);
    }
    else if(type === "userDocente"){
        sideDrawer.getViewById("topMatr").text = appSettings.getString("ruolo")+ " " +appSettings.getString("settore");
        sideDrawer.getViewById("topEmail").text = appSettings.getString("emailAte");
        sideDrawer.getViewById("topMatr").visibility = "visible";
        sideDrawer.getViewById("topEmail").visibility = "visible";
        console.log(appSettings.getNumber("idAb"));
        getPIC(appSettings.getNumber("idAb"),1);

    }
    else if(type === "userRistoratore"){
        //getPIC(appSettings.getNumber("idAb"),1);

    }
    else if(type === "userOther"){
        getPIC(appSettings.getNumber("persId"),0);
        sideDrawer.getViewById("topMatr").text = appSettings.getString("grpDes","");
        sideDrawer.getViewById("topMatr").visibility = "visible";

    }

}

function logout(){
    let grp = "GRP_" + appSettings.getNumber("grpId",0);
    console.log(grp);
    if(appSettings.getNumber("grpId",0) !== 0)
        firebase.unsubscribeFromTopic(grp).then(() => console.log("Unsubscribed from ",grp));

    let cds = "CDS_" + appSettings.getNumber("cdsId",0);
    console.log(cds);
    if(appSettings.getNumber("grpId",0) === 6)
        firebase.unsubscribeFromTopic(cds).then(() => console.log("Unsubscribed from ",cds));

    global.clearAll();
    sideDrawer.getViewById("userForm").visibility="collapsed";
    sideDrawer.getViewById("userDocente").visibility="collapsed";
    sideDrawer.getViewById("userRistoratore").visibility="collapsed";
    sideDrawer.getViewById("userOther").visibility="collapsed";
    sideDrawer.getViewById("topName").text = "Benvenuto!";
    sideDrawer.getViewById("loginForm").visibility="visible";
    sideDrawer.getViewById("topImg").backgroundImage = "~/images/logo_parth.png";
    page.getViewById("deleteBtn").visibility = "collapsed";
    sideDrawer.getViewById("topMatr").visibility = "collapsed";
    sideDrawer.getViewById("topEmail").visibility = "collapsed";

    const nav =
        {
            moduleName: "home/home-page",
            clearHistory: true
        };
    page.frame.navigate(nav);

}

function autoconnect() {
    console.log("REMEMBER= "+remember);
    if (remember){

        indicator.visibility = "visible";
        let user = appSettings.getString("username");
        console.log("USERNAME (old)= "+user);

        global.encodedStr = appSettings.getString("token");

        httpModule.request({
            url:  global.url + "login",
            method: "GET",
            headers: {
                "Content-Type" : "application/json",
                "Authorization" : "Basic "+ global.encodedStr
            }
        }).then((response) => {
            let _result = response.content.toJSON();

            if(response.statusCode === 401 || response.statusCode === 500 || response.statusCode === 403)
            {
                dialogs.alert({
                    title: "Autenticazione Fallita!",
                    message: _result.errMsg,
                    okButtonText: "OK"
                }).then(
                    args.object.closeModal()
                );
            }
            else if (response.statusCode === 200){

                /* Se un utente è di tipo USER TECNICO (ristorante) 202 */
                if (_result.user.grpDes === "Ristorante")
                {
                    let remember = sideDrawer.getViewById("rememberMe").checked;
                    console.log(_result);
                    sideDrawer.getViewById("badge_button_risto").text = "Staff Card/Badge";


                    appSettings.setString("nome", _result.user.nome);
                    appSettings.setString("cognome", _result.user.cognome);
                    appSettings.setString("userId", _result.userId);
                    appSettings.setString("emailAte",_result.user.email);
                    appSettings.setString("ristorante",_result.user.nomeBar);
                    appSettings.setString("matricola",_result.user.nomeBar);
                    appSettings.setString("sesso",_result.user.sesso);
                    appSettings.setString("telRes",_result.user.telefono);
                    appSettings.setString("facDes","--");
                    appSettings.setString("dataNascita","--");
                    /*
                    if (remember){
                        appSettings.setString("username",user);
                        appSettings.setString("password",pass);
                        appSettings.setBoolean("rememberMe",true);
                    }*/
                    global.isConnected = true;
                    sideDrawer.getViewById("topName").text = _result.user.nome + " "+_result.user.cognome;
                    setSideMenu("userRistoratore",_result.user.nome + " "+_result.user.cognome);
                    sideDrawer.getViewById("topMatr").text = _result.user.nomeBar;
                    sideDrawer.getViewById("topEmail").text = _result.user.email;
                    sideDrawer.getViewById("topMatr").visibility = "visible";
                    sideDrawer.getViewById("topEmail").visibility = "visible";

                    /*
                                    const nav =
                                        {
                                            moduleName: "ristoratore/ristoratore-home",
                                            clearHistory: true
                                        };
                                    page.frame.navigate(nav);

                     */
                }
                /* Se un utente è di tipo USER TECNICO */
                else if (_result.user.grpDes === "PTA")
                {
                    sideDrawer.getViewById("badge_button_other").text = "Staff Card/Badge";

                    console.log("PTA");
                    appSettings.setString("grpDes",_result.user.grpDes);
                    appSettings.setString("matricola","--");

                    let user = appSettings.getString("username",".");
                    let nc = user.split(".");
                    global.isConnected = true;

                    appSettings.setString("nome", nc[0].toUpperCase());
                    appSettings.setString("cognome", nc[1].toUpperCase());
                    let username  = nc[0].toUpperCase() + " " + nc[1].toUpperCase();

                    //sideDrawer.getViewById("topName").text = nc[0].toUpperCase() + " " + nc[1].toUpperCase();
                    //let userForm = sideDrawer.getViewById("userOther");
                    //let loginForm = sideDrawer.getViewById("loginForm");
                    //loginForm.visibility = "collapsed";
                    //userForm.visibility = "visible";

                    indicator.visibility = "collapsed";
                    setSideMenu("userOther",username);
                    /*
                                    const nav =
                                        {
                                            moduleName: "home/home-page",
                                            clearHistory: true
                                        };
                                    page.frame.navigate(nav);

                     */

                }
                else if(_result.user.grpDes === "Docenti")
                {
                    sideDrawer.getViewById("badge_button_docente").text = "Faculty Card/Badge";

                    appSettings.setNumber("idAb",_result.user.idAb);
                    console.log(_result.user.idAb,"Id");
                    let nome = appSettings.getString("nome");
                    let cognome = appSettings.getString("cognome");
                    let username = nome + " " + cognome;
                    console.log(username);

                    setSideMenu("userDocente",username);

                    console.log("DETAILED PROF");
                    detailedProf(_result.user.docenteId); // Get detailed info of a professor
                    console.log("SAVEINFO");
                    global.saveInfo(_result);
                    setAnagrafe(_result.user.docenteId,_result.user.grpDes);

                    global.isConnected = true;
                    //indicator.visibility = "collapsed";


                }
                else if (_result.user.grpDes === "Studenti")
                {
                    let carriere = _result.user.trattiCarriera;
                    sideDrawer.getViewById("badge_button").text = "Student Card/Badge";

                    global.saveInfo(_result);
                    setAnagrafe(_result.user.persId,_result.user.grpDes);
                    let index = appSettings.getNumber("carriera",0);
                    console.log(_result.user.persId);
                    global.saveCarr(carriere[index]);
                    appSettings.setNumber("persId", _result.user.persId);

                    getDepartment(carriere[index].stuId);
                    global.isConnected = true;
                    let nome = appSettings.getString("nome");
                    let cognome = appSettings.getString("cognome");
                    let username = nome + " " + cognome;
                    setSideMenu("userForm",username);
                }
                else if(_result.user.grpDes === "Registrati" || _result.user.grpDes === "Dottorandi" || _result.user.grpDes === "Ipot. Immatricolati" || _result.user.grpDes === "Preiscritti" || _result.user.grpDes=== "Iscritti"){
                    console.log("REGISTRATI/DOTT/ecc");
                    sideDrawer.getViewById("badge_button_other").text = "Student Card/Badge";

                    global.saveInfo(_result);
                    appSettings.setString("matricola","--");


                    let nome = _result.user.firstName;
                    let cognome = _result.user.lastName;
                    let username = nome + " " + cognome;

                    setSideMenu("userOther",username);
                    indicator.visibility = "collapsed";
                    global.isConnected = true;

                }

                else{
                    global.isConnected = true;
                    sideDrawer.getViewById("badge_button_other").text = "UniParthenope Card/Badge";

                    let nome = appSettings.getString("nome","");
                    let cognome = appSettings.getString("cognome","");
                    let username = nome + " " + cognome;

                    appSettings.setString("grpDes",_result.user.grpDes);
                    appSettings.setString("matricola","--");

                    if  (_result.user.persId !== undefined)
                        appSettings.setNumber("persId",_result.user.persId);

                    setSideMenu("userOther",username);
                    indicator.visibility = "collapsed";
                    /*
                    const nav =
                        {
                            moduleName: "home/home-page",
                            clearHistory: true
                        };
                    page.frame.navigate(nav);

                     */
                    console.log("ALTRO USER");
                }
            }

        },(e) => {
            dialogs.alert({
                title: "Errore: Home autoconnect",
                message: e.toString(),
                okButtonText: "OK"
            });
        });
        //indicator.visibility = "collapsed";
    }
}

exports.onNavigatingTo = function (args) {
    page = args.object;
    news = new ObservableArray();

    viewModel = observableModule.fromObject({
        news:news
    });
    sideDrawer = app.getRootView();
    indicator = page.getViewById("activityIndicator");

    rateApp();

    //Subscribe to ALL NEWS only the first time
    if(appSettings.getBoolean("subscribe_newsALL",true)){
        appSettings.setBoolean("subscribe_newsALL",false);
        appSettings.setBoolean("topic_newsall",true);

        firebase.subscribeToTopic("NEWS_ALL").then(() => console.log("Subscribed from ","NEWS_ALL"));
    }

    remember = appSettings.getBoolean("rememberMe");
    user = appSettings.getString("username");

    appversion.getVersionName().then(function(v) {
        page.getViewById("version").text = "Versione: " + v;
        sideDrawer.getViewById("version").text = "v. "+ v;
    });

    checkServer(10000);
    //initializeGraph();
    //console.log(global.tempPos);

    getNews();

    if(!global.tempPos){ //Setto la posizione attuale, soltanto alla prima apertura dell'app
        console.log("Setto la posizione!");
        getPosition();
        global.tempPos = true;
    }


   if (user !== undefined && !global.isConnected){
       indicator.visibility = "visible";
       dialogs.confirm({
           title: "Bentornato!",
           message: "Bentornato "+ appSettings.getString("nome") + " " + appSettings.getString("cognome")+"\n Cliccare OK per autoconnettersi.",
           okButtonText: "OK",
           cancelButtonText: 'Logout'
       }).then(function (r){
           if(r)
               autoconnect();
           else{
               indicator.visibility = "collapsed";
               logout();
           }

       });
   }
   else if (remember) {
      setSideMenu(global.myform,global.username);
   }

    page.bindingContext = viewModel;
}

exports.onDrawerButtonTap = function() {
    sideDrawer.showDrawer();
}

exports.onTapNotizie = function(){
  page.frame.navigate("general/notizie/notizie");
};

exports.onTapMeteo = function(){
    let loc;
    if (pos !== undefined)
        loc = { lat: pos.latitude, long: pos.longitude };
    else
        loc = {lat: 40.7, long: 14.17};
    page.showModal(modalViewModule, loc, false);
};

exports.onTapTrasporti = function(){
    page.frame.navigate("general/trasporti/trasporti");
};

exports.onTapAvvisi = function(){
    page.frame.navigate("general/avvisi/avvisi");
};

exports.onTapEventi = function(){
    const nav =
        {
            moduleName: "general/eventi/eventi"
        };
    page.frame.navigate(nav);
};

exports.onTapFood = function(){

    const nav =
        {
            moduleName: "general/menu/menu"
        };
    page.frame.navigate(nav);
};

exports.tap_scienze = function(){
    const nav =
        {
            moduleName: "general/department/department",
            context: {
                title: "DiST Dipartimento di Scienze e Tecnologie",
                id: "CDN",
                img: "CDN",
                color: '#009432',
                background:'linear-gradient(180deg, #009432, #5CC77A)',
                website: 'https://www.scienzeetecnologie.uniparthenope.it/',
                news: ''

            },
            animated: false
        };
    page.frame.navigate(nav);
};

exports.tap_ingegneria = function(){
    const nav =
        {
            moduleName: "general/department/department",
            context: {
                title: "Dipartimento di Ingegneria",
                id: "CDN",
                img: "Villa",
                color: '#222222',
                background:'linear-gradient(180deg, #222222, #444444)',
                website: 'https://www.ingegneria.uniparthenope.it',
                news: ''

            },
            animated: false
        };
    page.frame.navigate(nav);
};

exports.tap_motorie = function(){
    const nav =
        {
            moduleName: "general/department/department",
            context: {
                title: "Dipartimento di Scienze Motorie e del Benessere",
                id: "Medina",
                img: "Medina",
                color: '#dd6ca6',
                background:'linear-gradient(180deg, #dd6ca6, #f294c5)',
                website: 'https://www.motorie.uniparthenope.it',
                news: ''

            },
            animated: false
        };
    page.frame.navigate(nav);
};

exports.tap_giuris = function(){
    const nav =
        {
            moduleName: "general/department/department",
            context: {
                title: "Dipartimento di Giurisprudenza",
                id: "Parisi",
                img: "Parisi",
                color: '#774896',
                background:'linear-gradient(180deg, #774896, #ab76cf)',
                website: 'https://www.digiu.uniparthenope.it',
                news: ''

            },
            animated: false
        };
    page.frame.navigate(nav);
};

exports.tap_aziend = function(){
    const nav =
        {
            moduleName: "general/department/department",
            context: {
                title: "Dipartimento di Studi Aziendali ed Economici",
                id: "Parisi",
                img: "Acton",
                color: '#0b72b5',
                background:'linear-gradient(180deg, #0b72b5, #319ade)',
                website: 'https://www.disae.uniparthenope.it',
                news: ''

            },
            animated: false
        };
    page.frame.navigate(nav);
};

exports.ontap_fb = function(){
    utilsModule.openUrl("https://www.facebook.com/Parthenope");
};

exports.ontap_linkedin = function(){
    utilsModule.openUrl("https://www.linkedin.com/school/universit%C3%A0-degli-studi-di-napoli-'parthenope'");
};

exports.ontap_you = function(){
    utilsModule.openUrl("https://www.youtube.com/channel/UCNBZALzU97MuIKSMS_gnO6A");
};

exports.ontap_twi = function(){
    utilsModule.openUrl("https://twitter.com/uniparthenope");
};

exports.ontap_insta = function(){
    utilsModule.openUrl("https://www.instagram.com/uniparthenope");
};

