// Configuration Supabase
const SUPABASE_URL = "https://cowrsvkouqwnvonzpcur.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvd3JzdmtvdXF3bnZvbnpwY3VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxMjkxMDgsImV4cCI6MjA4ODcwNTEwOH0.g1GAzY-bvaz-om8MZsGTBhHIzY5zx1sbW3OVAGjAQZs"
const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let chart
let currentPeriod = "3h"; // période par défaut
let currentVariable = "temperature";

// Formatage français
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

// Afficher la dernière mesure
async function loadWeather() {
    const { data, error } = await client
        .from("weather_station")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1);

    if (error) {
        document.getElementById("data").innerHTML = error.message;
        return;
    }

    const w = data[0];
    document.getElementById("data").innerHTML =
        `🌡 Température : ${w.temperature} °C <br>
         💧 Humidité : ${w.humidity} % <br>
         🌬 Pression : ${w.pressure} hPa <br>
         💡 Luminosité : ${w.light} lx <br>
         🕒 Dernière mesure : ${formatDate(w.created_at)}`;
}

// Charger l’historique selon la période
async function getHistory() {
    let table;
    let timeColumn;

    switch (currentPeriod) {
        case "3h":
            table = "weather_3h";
            timeColumn = "created_at";
            limit = 180; // 1 point / minute
            break;
        case "24h":
            table = "weather_10min"; // moyenne 5 min
            timeColumn = "time_10min";
            limit = 144; // 1 point / 10 min
            break;
        case "7j":
            table = "weather_hourly"; // moyenne horaire
            timeColumn = "hour";
            limit = 168; // 1 point / heure
            break;
        case "30j":
            table = "weather_daily"; // moyenne journalière
            timeColumn = "day";
            limit = 30; // 1 point / jour
            break;
        default:
            table = "weather_station";
            timeColumn = "created_at";
            limit = 160;
    }

    const { data, error } = await client
        .from(table)
        .select("*")
        .order(timeColumn, { ascending: true })  // on utilise la colonne exacte
        .limit(limit); // limite pour ne pas trop charger de points

    if (error) {
        console.error(error);
        return [];
    }

    return data;
}

// Préparer les données pour Chart.js
function prepareData(data, variable) {
    const labels = [];
    const values = [];

    data.forEach(row => {
        let dateValue = row.created_at || row.time_5min || row.hour || row.day;
        labels.push(new Date(dateValue).toLocaleString("fr-FR", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "numeric" }));
        values.push(row[variable]);
    });

    return { labels, values };
}

// Créer le graphique
function createChart(labels, values, label) {
    const ctx = document.getElementById("weatherChart");
    if (chart) chart.destroy();

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
    });
}

// Mettre à jour le graphique
async function updateGraph() {
    const data = await getHistory();
    const prepared = prepareData(data, currentVariable);
    createChart(prepared.labels, prepared.values, currentVariable);
}

// Gestion des changements de variable
document.getElementById("variableSelect").addEventListener("change", e => {
    currentVariable = e.target.value;
    updateGraph();
});

// Gestion des changements de période
document.querySelectorAll("#periodButtons button").forEach(btn => {
    btn.addEventListener("click", e => {
        currentPeriod = e.target.dataset.period;
        updateGraph();
    });
});

// Initialisation
loadWeather();
updateGraph();
setInterval(loadWeather, 60000);