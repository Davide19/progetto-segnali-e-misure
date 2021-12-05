import { html } from 'lit-element';
import { NavElement } from '../core/nav-element';
import Chart from 'chart.js/auto';
import { FirebaseQuery } from '../core/firebase-query';


export class Graph extends NavElement {
    
    constructor() {
        super();
        this.firebaseQuery= new FirebaseQuery();
        this.chartData;
        this.control=false;     
        this.firebaseQuery.listenToChangesGraph(e => this.firebaseQuery.readGraph(data =>{this.chartData=data, this.aggiorna(this.control), this.control=true}))
        this.myChart;
               
    }
      aggiorna(control) {
        const ctx ='myChart';
        if(control){
        this.myChart.destroy();
        }
        this.myChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ["LUNEDI'", "MARTEDI'", "MERCOLEDI'","GIOVEDI'", "VENERDI'", "SABATO", "DOMENICA"],
                datasets: [
                    {
                        label: "ORE 0:00-5:59",
                        backgroundColor: 'rgba(75, 192, 192, 0.3)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1,
                        data: [ Math.round(this.chartData.mon1.total_time/this.chartData.mon1.total_cars),
                                Math.round(this.chartData.tue1.total_time/this.chartData.tue1.total_cars),
                                Math.round(this.chartData.wed1.total_time/this.chartData.wed1.total_cars),
                                Math.round(this.chartData.thu1.total_time/this.chartData.thu1.total_cars),
                                Math.round(this.chartData.fri1.total_time/this.chartData.fri1.total_cars),
                                Math.round(this.chartData.sat1.total_time/this.chartData.sat1.total_cars),
                                Math.round(this.chartData.sun1.total_time/this.chartData.sun1.total_cars)]
                    },
                    {
                        label: "ORE 6:00-11:59",
                        backgroundColor: 'rgba(255, 99, 132, 0.3)',
                        borderColor: 'rgba(255,99,132,1)',
                        borderWidth: 1,
                        data: [ Math.round(this.chartData.mon2.total_time/this.chartData.mon2.total_cars),
                                Math.round(this.chartData.tue2.total_time/this.chartData.tue2.total_cars),
                                Math.round(this.chartData.wed2.total_time/this.chartData.wed2.total_cars),
                                Math.round(this.chartData.thu2.total_time/this.chartData.thu2.total_cars),
                                Math.round(this.chartData.fri2.total_time/this.chartData.fri2.total_cars),
                                Math.round(this.chartData.sat2.total_time/this.chartData.sat2.total_cars),
                                Math.round(this.chartData.sun2.total_time/this.chartData.sun1.total_cars)]
                    },
                    {
                        label: "ORE 12:00-17:59",
                        backgroundColor: 'rgba(255, 206, 86, 0.3)',
                        borderColor: 'rgba(255, 206, 86, 1)',
                        borderWidth: 1,
                        data: [ Math.round(this.chartData.mon3.total_time/this.chartData.mon3.total_cars),
                                Math.round(this.chartData.tue3.total_time/this.chartData.tue3.total_cars),
                                Math.round(this.chartData.wed3.total_time/this.chartData.wed3.total_cars),
                                Math.round(this.chartData.thu3.total_time/this.chartData.thu3.total_cars),
                                Math.round(this.chartData.fri3.total_time/this.chartData.fri3.total_cars),
                                Math.round(this.chartData.sat3.total_time/this.chartData.sat3.total_cars),
                                Math.round(this.chartData.sun3.total_time/this.chartData.sun1.total_cars)]
                    },
                    {
                        label: "ORE 18:00-23:59",
                        backgroundColor: 'rgba(153, 102, 255, 0.3)',
                        borderColor: 'rgba(153, 102, 255, 1)',
                        borderWidth: 1,
                        data: [ Math.round(this.chartData.mon4.total_time/this.chartData.mon4.total_cars),
                                Math.round(this.chartData.tue4.total_time/this.chartData.tue4.total_cars),
                                Math.round(this.chartData.wed4.total_time/this.chartData.wed4.total_cars),
                                Math.round(this.chartData.thu4.total_time/this.chartData.thu4.total_cars),
                                Math.round(this.chartData.fri4.total_time/this.chartData.fri4.total_cars),
                                Math.round(this.chartData.sat4.total_time/this.chartData.sat4.total_cars),
                                Math.round(this.chartData.sun4.total_time/this.chartData.sun4.total_cars)]
                    },
                ]
            },
            options: {
                aspectRatio: 1.7,
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {                        
                            beginAtZero:true,
                            title: {
                                display: true,
                                text: 'Tempo Medio di Percorrenza [s] ' 
                            }                   
                    }
                }
            }
        });
      }

    render() {
        return html`  
            <canvas id="myChart"></canvas>

        `;
    }
    /*
    <div class = " columns  is-centered is-full ">
                        <div class = " column is-5 ">
                            <button class="button is-dark is-normal" @click=${e => this.aggiorna()}>CFERMA</button>
                        </div>
            </div>
            */
         
}


customElements.define('chart-component', Graph);