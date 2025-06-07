import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

function getSvgDimensions(svgId) {
    const svg = d3.select(`#${svgId}`);
    if (!svg.node()) {
        console.warn(`SVG with ID ${svgId} not found.`);
        return { width: 0, height: 0, margin: { left: 0, right: 0, top: 0, bottom: 0 } };
    }
    const width = +svg.style("width").split("px")[0];
    const height = +svg.style("height").split("px")[0];
    const margens = { left: 50, right: 25, top: 25, bottom: 50 };
    return { width, height, margens };
}

export async function loadDailyRideCountChart(data) {
    const svgId = "dailyRideCountChart";
    const { width, height, margens } = getSvgDimensions(svgId);
    const svg = d3.select(`#${svgId}`);
    if (!svg.node()) return;

    svg.selectAll("*").remove();

    const rideCountsByDay = d3
        .rollups(
            data,
            (v) => v.length,
            (d) => d.pickup_day_of_week
        )
        .map(([key, value]) => ({ dayOfWeek: key, count: value }));

    const dayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    const orderedData = Array.from({ length: 7 }, (_, i) => {
        const existing = rideCountsByDay.find((d) => d.dayOfWeek === i);
        return {
            dayOfWeek: i,
            dayName: dayNames[i],
            count: existing ? existing.count : 0,
        };
    }).sort((a, b) => a.dayOfWeek - b.dayOfWeek);

    const mapX = d3
        .scalePoint()
        .domain(orderedData.map((d) => d.dayName))
        .range([0, width - margens.left - margens.right])
        .padding(0.5);

    const mapY = d3
        .scaleLinear()
        .domain([0, d3.max(orderedData, (d) => d.count) * 1.1])
        .range([height - margens.bottom - margens.top, 0]);

    const xAxis = d3.axisBottom(mapX);
    svg.append("g")
        .attr("id", `axisX-${svgId}`)
        .attr("class", "x axis")
        .attr("transform", `translate(${margens.left}, ${height - margens.bottom})`)
        .call(xAxis);

    const yAxis = d3.axisLeft(mapY).ticks(5).tickFormat(d3.format(".2s"));
    svg.append("g")
        .attr("id", `axisY-${svgId}`)
        .attr("class", "y axis")
        .attr("transform", `translate(${margens.left}, ${margens.top})`)
        .call(yAxis);

    svg.append("text")
        .attr("class", "axis-label")
        .attr("x", margens.left + (width - margens.left - margens.right) / 2)
        .attr("y", height - margens.bottom / 2 + 10)
        .style("text-anchor", "middle")
        .text("Dia da Semana");

    svg.append("text")
        .attr("class", "axis-label")
        .attr("transform", `rotate(-90) translate(-${height / 2}, ${margens.left / 2 - 10})`)
        .style("text-anchor", "middle")
        .text("Número de Corridas");

    const line = d3
        .line()
        .x((d) => mapX(d.dayName))
        .y((d) => mapY(d.count));

    svg.append("g")
        .attr("transform", `translate(${margens.left}, ${margens.top})`)
        .append("path")
        .datum(orderedData)
        .attr("fill", "none")
        .attr("stroke", "#006A71")
        .attr("stroke-width", 2)
        .attr("d", line);

    svg.append("g")
        .attr("transform", `translate(${margens.left}, ${margens.top})`)
        .selectAll("circle")
        .data(orderedData)
        .enter()
        .append("circle")
        .attr("cx", (d) => mapX(d.dayName))
        .attr("cy", (d) => mapY(d.count))
        .attr("r", 4)
        .attr("fill", "#9ACBD0")
        .attr("stroke", "#006A71")
        .attr("stroke-width", 1);
}

export async function loadTipAmountByTimeChart(data) {
    const svgId = "tipTimeChart";
    const { width, height, margens } = getSvgDimensions(svgId);
    const svg = d3.select(`#${svgId}`);
    if (!svg.node()) return;

    svg.selectAll("*").remove();

    const processedData = data.map((d) => {
        const hour = d.pickup_hour;
        return { ...d, hour };
    });

    const tipAmountByHour = d3
        .rollups(
            processedData,
            (v) => d3.mean(v, (d) => d.tip_amount),
            (d) => d.hour
        )
        .map(([key, value]) => ({ hour: key, averageTip: value }));
    tipAmountByHour.sort((a, b) => a.hour - b.hour);

    const mapX = d3
        .scaleLinear()
        .domain(d3.extent(tipAmountByHour, (d) => d.hour))
        .range([0, width - margens.left - margens.right]);

    const mapY = d3
        .scaleLinear()
        .domain([0, d3.max(tipAmountByHour, (d) => d.averageTip) * 1.1])
        .range([height - margens.bottom - margens.top, 0]);

    const xAxis = d3.axisBottom(mapX).tickFormat(d3.format("d"));
    svg.append("g")
        .attr("id", `axisX-${svgId}`)
        .attr("class", "x axis")
        .attr("transform", `translate(${margens.left}, ${height - margens.bottom})`)
        .call(xAxis);

    const yAxis = d3.axisLeft(mapY).ticks(5);
    svg.append("g")
        .attr("id", `axisY-${svgId}`)
        .attr("class", "y axis")
        .attr("transform", `translate(${margens.left}, ${margens.top})`)
        .call(yAxis);

    svg.append("text")
        .attr("class", "axis-label")
        .attr("x", margens.left + (width - margens.left - margens.right) / 2)
        .attr("y", height - margens.bottom / 2 + 10)
        .style("text-anchor", "middle")
        .text("Hora do Dia (24h)");

    svg.append("text")
        .attr("class", "axis-label")
        .attr("transform", `rotate(-90) translate(-${height / 2}, ${margens.left / 2 - 10})`)
        .style("text-anchor", "middle")
        .text("Gorjeta Média");

    const line = d3
        .line()
        .x((d) => mapX(d.hour))
        .y((d) => mapY(d.averageTip));

    svg.append("g")
        .attr("transform", `translate(${margens.left}, ${margens.top})`)
        .append("path")
        .datum(tipAmountByHour)
        .attr("fill", "none")
        .attr("stroke", "#006A71")
        .attr("stroke-width", 2)
        .attr("d", line);

    svg.append("g")
        .attr("transform", `translate(${margens.left}, ${margens.top})`)
        .selectAll("circle")
        .data(tipAmountByHour)
        .enter()
        .append("circle")
        .attr("cx", (d) => mapX(d.hour))
        .attr("cy", (d) => mapY(d.averageTip))
        .attr("r", 4)
        .attr("fill", "#9ACBD0")
        .attr("stroke", "#006A71")
        .attr("stroke-width", 1);
}

export async function loadWeekdayWeekendChart(data) {
    const svgId = "weekdayWeekendChart";
    const { width, height, margens } = getSvgDimensions(svgId);
    const svg = d3.select(`#${svgId}`);
    if (!svg.node()) return;

    svg.selectAll("*").remove();

    const processedData = data.map((d) => {
        const dayOfWeek = d.pickup_day_of_week;
        const dayType = dayOfWeek === 0 || dayOfWeek === 6 ? "Fim de Semana" : "Dia de Semana";
        return { ...d, dayType };
    });

    const dayTypeCounts = d3
        .rollups(
            processedData,
            (v) => v.length,
            (d) => d.dayType
        )
        .map(([key, value]) => ({ dayType: key, count: value }));

    dayTypeCounts.sort((a, b) => {
        if (a.dayType === "Dia de Semana" && b.dayType === "Fim de Semana") return -1;
        if (a.dayType === "Fim de Semana" && b.dayType === "Dia de Semana") return 1;
        return 0;
    });

    const mapX = d3
        .scaleBand()
        .domain(dayTypeCounts.map((d) => d.dayType))
        .range([0, width - margens.left - margens.right])
        .padding(0.1);

    const mapY = d3
        .scaleLinear()
        .domain([0, d3.max(dayTypeCounts, (d) => d.count) * 1.1])
        .range([height - margens.bottom - margens.top, 0]);

    const xAxis = d3.axisBottom(mapX);
    svg.append("g")
        .attr("id", `axisX-${svgId}`)
        .attr("class", "x axis")
        .attr("transform", `translate(${margens.left}, ${height - margens.bottom})`)
        .call(xAxis);

    const yAxis = d3.axisLeft(mapY).ticks(5).tickFormat(d3.format(".2s"));
    svg.append("g")
        .attr("id", `axisY-${svgId}`)
        .attr("class", "y axis")
        .attr("transform", `translate(${margens.left}, ${margens.top})`)
        .call(yAxis);

    svg.append("text")
        .attr("class", "axis-label")
        .attr("x", margens.left + (width - margens.left - margens.right) / 2)
        .attr("y", height - margens.bottom / 2 + 10)
        .style("text-anchor", "middle")
        .text("Tipo de Dia");

    svg.append("text")
        .attr("class", "axis-label")
        .attr("transform", `rotate(-90) translate(-${height / 2}, ${margens.left / 2 - 10})`)
        .style("text-anchor", "middle")
        .text("Número de Corridas");

    svg.append("g")
        .attr("transform", `translate(${margens.left}, ${margens.top})`)
        .selectAll(".bar")
        .data(dayTypeCounts)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", (d) => mapX(d.dayType))
        .attr("y", (d) => mapY(d.count))
        .attr("width", mapX.bandwidth())
        .attr("height", (d) => height - margens.bottom - margens.top - mapY(d.count));
}

export function clearAllCharts() {
    d3.select("#weekdayWeekendChart").selectAll("*").remove();
    d3.select("#dailyRideCountChart").selectAll("*").remove();
    d3.select("#tipTimeChart").selectAll("*").remove();
}
