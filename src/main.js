import { Taxi } from "./taxi.js";
import { loadDailyRideCountChart, loadTipAmountByTimeChart, clearAllCharts, loadWeekdayWeekendChart } from "./plot.js";

function callbacks(data) {
    const loadBtn = document.querySelector("#loadBtn");
    const clearBtn = document.querySelector("#clearBtn");

    if (!loadBtn || !clearBtn) {
        return;
    }

    loadBtn.addEventListener("click", async () => {
        clearAllCharts();
        await loadDailyRideCountChart(data);
        await loadTipAmountByTimeChart(data);
        await loadWeekdayWeekendChart(data);
    });

    clearBtn.addEventListener("click", async () => {
        clearAllCharts();
    });
}

window.onload = async () => {
    const taxi = new Taxi();

    await taxi.init();
    await taxi.loadTaxi();

    const sql = `
        SELECT
            lpep_pickup_datetime,
            trip_distance,
            tip_amount,
            -- Extrair dia da semana (0=Domingo, 1=Segunda, ..., 6=Sábado)
            CAST(strftime(lpep_pickup_datetime, '%w') AS INTEGER) AS pickup_day_of_week,
            -- Extrair hora (00-23)
            CAST(strftime(lpep_pickup_datetime, '%H') AS INTEGER) AS pickup_hour
        FROM
            taxi_2023
            `;

    const data = await taxi.query(sql);
    callbacks(data);
};
