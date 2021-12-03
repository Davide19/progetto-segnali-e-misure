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
        console.log(this.chartData)
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
                        data: [this.chartData.mon1.mean_time,
                                this.chartData.tue1.mean_time,
                                this.chartData.wed1.mean_time,
                                this.chartData.thu1.mean_time,
                                this.chartData.fri1.mean_time,
                                this.chartData.sat1.mean_time,
                                this.chartData.sun1.mean_time]
                    },
                    {
                        label: "ORE 6:00-11:59",
                        backgroundColor: 'rgba(255, 99, 132, 0.3)',
                        borderColor: 'rgba(255,99,132,1)',
                        borderWidth: 1,
                        data: [this.chartData.mon2.mean_time,
                            this.chartData.tue2.mean_time,
                            this.chartData.wed2.mean_time,
                            this.chartData.thu2.mean_time,
                            this.chartData.fri2.mean_time,
                            this.chartData.sat2.mean_time,
                            this.chartData.sun2.mean_time]
                    },
                    {
                        label: "ORE 12:00-17:59",
                        backgroundColor: 'rgba(255, 206, 86, 0.3)',
                        borderColor: 'rgba(255, 206, 86, 1)',
                        borderWidth: 1,
                        data: [this.chartData.mon3.mean_time,
                            this.chartData.tue3.mean_time,
                            this.chartData.wed3.mean_time,
                            this.chartData.thu3.mean_time,
                            this.chartData.fri3.mean_time,
                            this.chartData.sat3.mean_time,
                            this.chartData.sun3.mean_time]
                    },
                    {
                        label: "ORE 18:00-23:59",
                        backgroundColor: 'rgba(153, 102, 255, 0.3)',
                        borderColor: 'rgba(153, 102, 255, 1)',
                        borderWidth: 1,
                        data: [this.chartData.mon4.mean_time,
                            this.chartData.tue4.mean_time,
                            this.chartData.wed4.mean_time,
                            this.chartData.thu4.mean_time,
                            this.chartData.fri4.mean_time,
                            this.chartData.sat4.mean_time,
                            this.chartData.sun4.mean_time]
                    },
                ]
            },
            options: {
                aspectRatio: 1.85,
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {                        
                            beginAtZero:true,
                            title: {
                                display: true,
                                text: 'Tempo Medio di Percorrenza [min] ' 
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