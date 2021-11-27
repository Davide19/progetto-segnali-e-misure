import { html } from 'lit-element';
import { NavElement } from '../core/nav-element';
import Chart from 'chart.js/auto';

export class HomePage extends NavElement {
    constructor() {
        super();
    }
    firstUpdated() {
        const ctx ='myChart2';    
        const myChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ["Red", "Blue", "Yellow", "Green", "Purple", "Orange"],
                datasets: [{
                    label: '# of Votes',
                    data: [12, 19, 3, 5, 2, 3],
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.2)',
                        'rgba(54, 162, 235, 0.2)',
                        'rgba(255, 206, 86, 0.2)',
                        'rgba(75, 192, 192, 0.2)',
                        'rgba(153, 102, 255, 0.2)',
                        'rgba(255, 159, 64, 0.2)'
                    ],
                    borderColor: [
                        'rgba(255,99,132,1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: false,
                maintainAspectRatio: true,
                scales: {
                    y: {                        
                            beginAtZero:true                        
                    }
                }
            }
        });
      }
    render() {
        return html` 
            <br>
            <div class = " columns is-centered is-full ">
                <div class = " column is-11 ">
                    <h1  class = " title is-size-2 has-text-centered has-text-dark is-italic has-text-weight-bold ">GESTIONE GALLERIA</h1>
                </div> 
            </div>
            <br>
            <div class = " columns  is-centered is-full ">
                <div class = " column is-3 ">
                    <h1  class = " title is-size-3 has-text-centered has-text-dark is-italic has-text-weight-bold ">STATISTICHE</h1>
                    <div class = " columns  is-centered is-full ">
                        <div class = " column is-9 ">
                            <h1  class = " title is-size-5 has-text-left has-text-dark is-italic has-text-weight-bold ">Auto in questo momento</h1>
                        </div>
                        <div class = " column is-2 ">
                            <h1  class = " title is-size-5 has-text-centered has-text-dark is-italic has-text-weight-bold ">2</h1>
                        </div>
                    </div>
                    <hr>                    
                    <div class = " columns  is-centered is-full ">
                        <div class = " column is-9 ">
                            <h1  class = " title is-size-5 has-text-left has-text-dark is-italic has-text-weight-bold ">tasso di cooupazione</h1>
                        </div>
                        <div class = " column is-2 ">
                            <h1  class = " title is-size-5 has-text-centered has-text-dark is-italic has-text-weight-bold ">2</h1>
                        </div>
                    </div>
                    <hr>
                    <div class = " columns  is-centered is-full ">
                        <div class = " column is-9 ">
                            <h1  class = " title is-size-5 has-text-left has-text-dark is-italic has-text-weight-bold ">tempo di percorrenza</h1>
                        </div>
                        <div class = " column is-2 ">
                            <h1  class = " title is-size-5 has-text-centered has-text-dark is-italic has-text-weight-bold ">2</h1>
                        </div>
                    </div>
                    <hr>
                    <div class = " columns  is-centered is-full ">
                        <div class = " column is-9 ">
                            <h1  class = " title is-size-5 has-text-left has-text-dark is-italic has-text-weight-bold ">limite di velocità</h1>
                        </div>
                        <div class = " column is-2 ">
                            <h1  class = " title is-size-5 has-text-centered has-text-dark is-italic has-text-weight-bold ">2</h1>
                        </div>
                    </div>
                    <hr>
                    <div class = " columns  is-centered is-full ">
                        <div class = " column is-9 ">
                            <h1  class = " title is-size-5 has-text-left has-text-dark is-italic has-text-weight-bold ">lunghezza</h1>
                        </div>
                        <div class = " column is-2 ">
                            <h1  class = " title is-size-5 has-text-centered has-text-dark is-italic has-text-weight-bold ">2</h1>
                        </div>
                    </div>
                    <hr>
                    <div class = " columns  is-centered is-full ">
                        <div class = " column is-9 ">
                            <h1  class = " title is-size-5 has-text-left has-text-dark is-italic has-text-weight-bold ">tasso di occupazione medio periodo</h1>
                        </div>
                        <div class = " column is-2 ">
                            <h1  class = " title is-size-5 has-text-centered has-text-dark is-italic has-text-weight-bold ">3</h1>
                        </div>
                    </div>
                    <hr> 
                    <div class = " columns  is-centered is-full ">
                        <div class = " column is-5 ">
                            <button route = "/prova" class="button is-dark">CONFERMA</button>
                        </div>
                    </div>
                </div> 

                <div class = " column is-9 ">
                    <h1  class = " title is-size-3 has-text-centered has-text-dark is-italic has-text-weight-bold ">GRAFICO</h1>
                    <div>
                        <canvas id="myChart2" style=" background-color:rgb(250,250,250) " width="400" height="400"></canvas>
                    </div>
                </div>
            </div>
            
        `;
    }
         
}


customElements.define('home-page', HomePage);