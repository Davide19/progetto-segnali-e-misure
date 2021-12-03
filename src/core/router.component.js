import '../pages/home-page';
import '../pages/clock-component';
import '../pages/chart-component';
import '../pages/parameters-component';



export class RouterComponent extends HTMLElement {

    constructor() {
        super();
        this.routes = [
            { path: '/', element: 'home-page' , description: "Home"},
            //{ path: '/chart', element: 'chart-component' , description: "grafico" },
            //{ path: '/clock' , element: 'clock-element' , description: "orologio"},
            //{ path: '/remove-page' , element: 'remove-page' , description: "Elimina"},

        ];

        //aggiungo un listener per quando si preme i tasti avanti e indietro nel browser
        window.addEventListener('popstate', () => this.navigate(document.location.pathname, false));
        window.addEventListener('navigate', (e) => this.navigate(e.detail, true))
        //chiamo navigate anche al primo avvio della pagina
        this.navigate(document.location.pathname, true);
    }

    //imposta a tutti i pulsanti con l'attributo route un listener a navigate
    setListenerToActiveRoutes() {
        let activeRoutes = Array.from(this.querySelectorAll('[route]'));
        activeRoutes.forEach(activeRoute => {
            activeRoute.addEventListener('click', () => {
                this.navigate(activeRoute.attributes.route.value, true);
            });
        })
    }

    /*path è il percorso a cui si vuole andare, pushState indica se si deve fare il push nella history
    pushState = false nel listener a popstate altrimenti tasto back non funziona*/
    navigate(path, pushState) {
        //ottengo la rotta corretta
        let route = this.routes.find(item => item.path === path);
        if (route) {
                //cambio la pagina a seconda del path
                const newElement = document.createElement(route.element);
                while (this.firstChild) {
                    this.removeChild(this.firstChild);
                }
                this.appendChild(newElement);

                /*chiamo la funzione setListener solo dopo timeout di 0 ms,
                in caso contario non si rilevano <button>, perchè appendChild() asincrona                
                */
                setTimeout(() => {
                    this.setListenerToActiveRoutes();
                }, 0);
                document.title = 'Galleria - ' + route.description;
                if (pushState) {
                    history.pushState({}, '', route.path);
                }
        }
        else{
            console.log ("ERROR 404 PAGE NOT FOUND");
            this.navigate('/', true);
        }
    }
}

customElements.define('router-component', RouterComponent);