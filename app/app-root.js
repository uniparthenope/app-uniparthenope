const app = require("tns-core-modules/application");
const frame = require("tns-core-modules/ui/frame");
const observableModule = require("tns-core-modules/data/observable");
const httpModule = require("tns-core-modules/http");
const appSettings = require("application-settings");
const dialogs = require("tns-core-modules/ui/dialogs");
const modalViewModule = "modal-login/modal-login";
var base64= require('base-64');
var utf8 = require('utf8');

let viewModel;

function pageLoaded(args) {
    const page = args.object;
    viewModel = observableModule.fromObject({});
    page.bindingContext = viewModel;

}

exports.onTapLogin = function() {
    let sideDrawer = app.getRootView();
    let user = sideDrawer.getViewById("username").text;
    let pass = sideDrawer.getViewById("password").text;

    let remember = sideDrawer.getViewById("rememberMe").checked;
    if (remember){
        appSettings.setString("username",user);
        appSettings.setString("password",pass);
        appSettings.setBoolean("rememberMe",true);
    }

    let token = user + ":" + pass;
    var bytes = utf8.encode(token);
    global.encodedStr = base64.encode(bytes);
    sideDrawer.showModal(modalViewModule, "", () => {}, false);
    //global.loginT(user,pass);

};

//Go to Settings page
exports.goto_settings = function () {
    const nav =
        {
            moduleName: "settings/settings",
        };
    frame.topmost().navigate(nav);

};
exports.goto_about = function () {
    const nav =
        {
            moduleName: "userHome/userHome",
        };
    frame.topmost().navigate(nav);

};

exports.goto_home = function () {
    const nav =
        {
            moduleName: "userHome/userHome",
            clearHistory: true
        };
    frame.topmost().navigate(nav);

};

function logout()
{
    let url = "https://uniparthenope.esse3.cineca.it/e3rest/api/logout";

    httpModule.request({
        url: url,
        method: "GET",
        headers: {"Content-Type": "application/json",
            "Authorization":"Basic "+ global.encodedStr}
    }).then((response) => {
        const result = response.content.toJSON();

        console.log(result);

    },(e) => {
        console.log("Error", e.retErrMsg);
    });
}



exports.pageLoaded = pageLoaded;
