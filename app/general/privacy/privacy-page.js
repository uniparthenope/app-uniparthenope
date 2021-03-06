const observableModule = require("tns-core-modules/data/observable");
const app = require("tns-core-modules/application");
const httpModule = require("tns-core-modules/http");
const dialogs = require("tns-core-modules/ui/dialogs");

let sideDrawer;
let page;
let viewModel;
let loading;
//let privacy = '<p>Come &egrave; noto il Regolamento Europeo 2016/679 GDPR (General Data Protection Regulation), relativo alla protezione delle persone fisiche con riguardo al trattamento dei dati personali applicabile dal 25 maggio 2018, prescrive, all&rsquo;art.37, l&rsquo;obbligo, per le amministrazioni pubbliche, di nominare il Responsabile della protezione dei dati (DPO). <br>Si comunica che per l&rsquo;Universit&agrave; Parthenope &egrave; stato nominato quale Responsabile della protezione dei dati la Prof. Anna Papa, delegato per gli Affari Giuridici e Istituzionali (D.R. 311 del 14 maggio 2018). <br>Nell&rsquo;ambito delle funzioni attribuite con tale mandato, come previsto dall&rsquo;art. 39 del Regolamento Europeo Privacy, la Prof.. Papa &nbsp;in particolare: </p> <p>&nbsp;- collabora con il titolare al fine dell&rsquo;assunzione di ogni azione necessaria a dare attuazione alla nuova normativa; <br>- svolge attivit&agrave; di informazione e consulenza nei confronti dei responsabili del trattamento riguardo agli obblighi derivanti dal regolamento europeo e da altre disposizioni in materia di protezione dei dati;<br>&nbsp;- controlla l&rsquo;osservanza del regolamento nell&rsquo;ambito di applicazione.</p><p>A supporto dell&rsquo;attivit&agrave; del DPO, con O.d.s del Direttore Generale n.18 del 14/05/2018 &egrave; stato costituito il gruppo di lavoro &ldquo;protezione dei dati personali&rdquo;, i cui contatti sono di seguito riportati nella presente pagina.</p><p>Nell&rsquo;ambito degli adempimenti previsti dal Regolamento Europeo (GDPR) l&rsquo;Universit&agrave; Parthenope ha provveduto ad istituire il &ldquo;Registro delle attivit&agrave; di trattamento dei dati&rdquo; del Titolare previsto dall&rsquo;art. 30 del citato regolamento (nota prot.&nbsp;<a href=\"tel:0031524/2018\">0031524/2018</a>).</p><p><span><a href=\"https://www.uniparthenope.it/sites/default/files/privacy/procedura_data_breach.pdf\" target=\"_blank\" title=\"PROCEDURA DATA BREACH  - The document opens in new window\" type=\"application/pdf; length=574922\">PROCEDURA DATA BREACH</a></span></p><p><span><a href=\"https://www.uniparthenope.it/sites/default/files/informativa_parthenope_concorsi_e_selezioni_ga_18.10.2018.pdf\" target=\"_blank\" title=\"Informativa Concorsi e selezioni  - The document opens in new window\" type=\"application/pdf; length=283728\">Informativa Concorsi e selezioni</a></span></p><p><span><a href=\"https://www.uniparthenope.it/sites/default/files/documenti/informativa_studenti.pdf\" target=\"_blank\" title=\"Informativa Studente  - The document opens in new window\">Informativa Studente</a></span></p><p><span><a href=\"https://www.uniparthenope.it/sites/default/files/informativa_orientamento_19.10.2018.pdf\" target=\"_blank\" title=\"Informativa Orientamento  - The document opens in new window\" type=\"application/pdf; length=285722\">Informativa Orientamento</a></span></p><p><span><a href=\"https://www.uniparthenope.it/sites/default/files/informativa_terzi_e_placement.pdf\" target=\"_blank\" title=\"Informativa Terzi e Placement  - The document opens in new window\" type=\"application/pdf; length=248033\">Informativa Terzi e Placement</a></span></p><p><span><a href=\"https://www.uniparthenope.it/sites/default/files/privacy/informativa_sito_web.pdf\" target=\"_blank\" title=\"Informativa Sito Web  - The document opens in new window\" type=\"application/pdf; length=527764\">Informativa Sito Web</a></span><span><a href=\"https://www.uniparthenope.it/sites/default/files/informativa_parthenope_idem.pdf\" style=\"box-sizing: border-box; background-color: transparent; color: rgb(12, 82, 153); text-decoration: underline; margin-left: 8px; font-family: Roboto, sans-serif;\" target=\"_blank\" title=\"  - The document opens in new window\"></a></span></p><p><span><a href=\"https://www.uniparthenope.it/sites/default/files/privacy/informativa_sito_web.pdf\" rel=\"noopener noreferrer\" target=\"_blank\" title=\"informativa_sito_web.pdf  - The document opens in new window\" type=\"application/pdf; length=527764\">Informativa_sito_web.pdf</a></span></p>'
let privacy = '';

exports.onNavigatingTo = function(args) {
    page = args.object;

    viewModel = observableModule.fromObject({
        privacy:privacy
    });

    sideDrawer = app.getRootView();
    sideDrawer.closeDrawer();

    loading = page.getViewById("activityIndicator");

    httpModule.request({
        url: global.url + "general/privacy",
        method: "GET"
    }).then((response) => {
        loading.visibility = "visible";

        let result = response.content.toJSON();

        if (response.statusCode === 401 || response.statusCode === 500) {
            dialogs.alert({
                title: "Errore: Privacy-Page",
                message: result.errMsg,
                okButtonText: "OK"
            }).then(
                loading.visibility = "collapsed"
            );
        }
        else {
            loading.visibility = "collapsed";
            console.log(result.privacy);
            privacy = result.privacy;
        }

    },(e) => {
        console.log("Error", e);
        dialogs.alert({
            title: "Errore: Privacy-Page",
            message: e.toString(),
            okButtonText: "OK"
        });
    });

    page.bindingContext = viewModel;
}

exports.onDrawerButtonTap = function() {
    const sideDrawer = app.getRootView();
    sideDrawer.showDrawer();
}