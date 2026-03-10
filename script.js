// Configuration Supabase
const SUPABASE_URL = "https://cowrsvkouqwnvonzpcur.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvd3JzdmtvdXF3bnZvbnpwY3VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxMjkxMDgsImV4cCI6MjA4ODcwNTEwOH0.g1GAzY-bvaz-om8MZsGTBhHIzY5zx1sbW3OVAGjAQZs"
const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Fonction pour récupérer les données météo
async function loadWeather() {
    try {
        const { data, error } = await client
            .from("weather_station")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(1);

        if (error) throw error;

        const w = data[0];

        document.getElementById("data").innerHTML = `
            🌡 Température : ${w.temperature} °C <br>
            💧 Humidité : ${w.humidity} % <br>
            🌬 Pression : ${w.pressure} hPa <br>
            💡 Lumière : ${w.light} lx <br>
            🕒 Dernière mesure : ${w.created_at}
        `;
    } catch (err) {
        document.getElementById("data").innerHTML = "Erreur : " + err.message;
    }
}

// Chargement initial
loadWeather();

// Rafraîchissement toutes les 10 secondes
setInterval(loadWeather, 10000);