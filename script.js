// Configuration Supabase
const SUPABASE_URL = "https://cowrsvkouqwnvonzpcur.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvd3JzdmtvdXF3bnZvbnpwY3VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxMjkxMDgsImV4cCI6MjA4ODcwNTEwOH0.g1GAzY-bvaz-om8MZsGTBhHIzY5zx1sbW3OVAGjAQZs"
const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let chart

function formatDate(dateString) {

    const date = new Date(dateString)

    return date.toLocaleString("fr-FR", {

        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"

    })

}

async function loadWeather() {

    const { data, error } = await client

        .from("weather_station")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)

    if (error) {

        document.getElementById("data").innerHTML = error.message
        return

    }

    const w = data[0]

    const dateFormatted = formatDate(w.created_at)

    document.getElementById("data").innerHTML =

        `
        🌡 Température : ${w.temperature} °C <br>
        💧 Humidité : ${w.humidity} % <br>
        🌬 Pression : ${w.pressure} hPa <br>
        💡 Luminosité : ${w.light} lx <br>
        🕒 Dernière mesure : ${dateFormatted}
        `

}

async function getHistory() {

    const { data, error } = await client

        .from("weather_station")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(120)
        .order("created_at", { ascending: true })

    if (error) {

        console.error(error)
        return []

    }

    return data

}

function prepareData(data, variable) {

    const labels = []
    const values = []

    data.forEach(row => {

        labels.push(new Date(row.created_at).toLocaleTimeString("fr-FR"))
        values.push(row[variable])

    })

    return { labels, values }

}

function createChart(labels, values, label) {

    const ctx = document.getElementById("weatherChart")

    if (chart) {

        chart.destroy()

    }

    chart = new Chart(ctx, {

        type: "line",

        data: {

            labels: labels,

            datasets: [{

                label: label,
                data: values,
                tension: 0.2

            }]

        },

        options: {

            responsive: true,

            scales: {

                x: { title: { display: true, text: "Temps" } },

                y: { title: { display: true, text: label } }

            }

        }

    })

}

async function updateGraph() {

    const variable = document.getElementById("variableSelect").value

    const data = await getHistory()

    const prepared = prepareData(data, variable)

    createChart(prepared.labels, prepared.values, variable)

}

document
    .getElementById("variableSelect")
    .addEventListener("change", updateGraph)

loadWeather()

updateGraph()

setInterval(loadWeather, 60000)