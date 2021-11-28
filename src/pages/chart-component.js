import { html } from 'lit-element';
import { NavElement } from '../core/nav-element';
import Chart from 'chart.js/auto';

export class Graph extends NavElement {
    constructor() {
        super();
    }

    
    firstUpdated() {
        const ctx ='myChart';
        
        const myChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ["LUNEDI'", "MARTEDI'", "MERCOLEDI'","GIOVEDI'", "VENERDI'", "SABATO", "DOMENICA"],
                datasets: [
                    {
                        label: "ORE 0:00-5:59",
                        backgroundColor: 'rgba(75, 192, 192, 0.3)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1,
                        data: [3,7,4,2,2,2,2]
                    },
                    {
                        label: "ORE 6:00-11:59",
                        backgroundColor: 'rgba(255, 99, 132, 0.3)',
                        borderColor: 'rgba(255,99,132,1)',
                        borderWidth: 1,
                        data: [4,3,5,2,2,2,2]
                    },
                    {
                        label: "ORE 12:00-17:59",
                        backgroundColor: 'rgba(255, 206, 86, 0.3)',
                        borderColor: 'rgba(255, 206, 86, 1)',
                        borderWidth: 1,
                        data: [7,2,6,2,2,2,2]
                    },
                    {
                        label: "ORE 18:00-23:59",
                        backgroundColor: 'rgba(153, 102, 255, 0.3)',
                        borderColor: 'rgba(153, 102, 255, 1)',
                        borderWidth: 1,
                        data: [4,3,5,2,2,2,3]
                    },
                ]
            },
            options: {
                aspectRatio: 1.85,
                responsive: true,
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
            <canvas id="myChart"></canvas>
        `;
    }
         
}


customElements.define('chart-component', Graph);