import { html } from 'lit-element';
import { NavElement } from '../core/nav-element';


export class HomePage extends NavElement {
    constructor() {
        super();
    }
    
    render() {
        return html` 
            <br>
            <div class = " columns is-centered is-full ">
                <div class = " column is-11 ">
                    <h1  class = " title is-1 has-text-centered has-text-dark is-italic has-text-weight-bold ">GESTIONE GALLERIA</h1>
                </div> 
            </div>
            <br>
            <div class = " columns  is-centered is-full ">
                <div class = " column is-3 ">
                    <h1  class = " title is-2 has-text-centered has-text-dark is-italic has-text-weight-bold ">STATISTICHE</h1>
                    <div class = " columns  is-centered is-full ">
                        <div class = " column is-11 ">
                            <clock-component></clock-component>
                        </div>
                    </div>
                    <hr> 
                    <div class = " columns  is-centered is-full ">
                        <div class = " column is-9 ">
                            <h1  class = " title is-3 has-text-left has-text-dark">Auto in questo momento</h1>
                        </div>
                        <div class = " column is-2 ">
                            <h1  class = " title is-3 has-text-centered has-text-dark">2</h1>
                        </div>
                    </div>
                    <hr>                    
                    <div class = " columns  is-centered is-full ">
                        <div class = " column is-9 ">
                            <h1  class = " title is-3 has-text-left has-text-dark">tasso di cooupazione</h1>
                        </div>
                        <div class = " column is-2 ">
                            <h1  class = " title is-3 has-text-centered has-text-dark">2</h1>
                        </div>
                    </div>
                    <hr>
                    <div class = " columns  is-centered is-full ">
                        <div class = " column is-9 ">
                            <h1  class = " title is-3 has-text-left has-text-dark  ">tempo di percorrenza</h1>
                        </div>
                        <div class = " column is-2 ">
                            <h1  class = " title is-3 has-text-centered has-text-dark  ">2</h1>
                        </div>
                    </div>
                    <hr>
                    <div class = " columns  is-centered is-full ">
                        <div class = " column is-9 ">
                            <h1  class = " title is-3 has-text-left has-text-dark   ">limite di velocità</h1>
                        </div>
                        <div class = " column is-2 ">
                            <h1  class = " title is-3 has-text-centered has-text-dark   ">2</h1>
                        </div>
                    </div>
                    <hr>
                    <div class = " columns  is-centered is-full ">
                        <div class = " column is-9 ">
                            <h1  class = " title is-3 has-text-left has-text-dark   ">lunghezza</h1>
                        </div>
                        <div class = " column is-2 ">
                            <h1  class = " title is-3 has-text-centered has-text-dark  ">2</h1>
                        </div>
                    </div>
                    <hr>
                    <div class = " columns  is-centered is-full ">
                        <div class = " column is-9 ">
                            <h1  class = " title is-3 has-text-left has-text-dark  ">tasso di occupazione medio periodo</h1>
                        </div>
                        <div class = " column is-2 ">
                            <h1  class = " title is-3 has-text-centered has-text-dark  ">3</h1>
                        </div>
                    </div>
                    <hr> 
                    <div class = " columns  is-centered is-full ">
                        <div class = " column is-5 ">
                            <button route = "/chart" class="button is-dark is-normal">CONFERMA</button>
                        </div>
                    </div>
                </div> 
                <div class = " column is-9 ">
                    <h1  class = " title is-2 has-text-centered has-text-dark is-italic has-text-weight-bold ">GRAFICO</h1>
                    <div class = " columns  is-centered is-full ">
                        <div class = " column is-10 " style="width:70vw">
                            <chart-component></chart-component>
                        </div>
                    </div>
                </div>
            </div>
            
        `;
    }
         
}


customElements.define('home-page', HomePage);