const API_KEY = '903f9ed15219e84598021cc84320db32';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';
const imdbCache = {};

const rows = [
  { id: 'popular', title: 'Most Popular Movies', endpoint: '/movie/popular' },
  { id: 'top-rated', title: 'Top Rated Movies', endpoint: '/movie/top_rated' },
  { id: 'horror', title: 'Top Horror', endpoint: '/discover/movie?with_genres=27&sort_by=vote_average.desc&vote_count.gte=500&region=US' },
  { id: 'thriller', title: 'Top Thriller', endpoint: '/discover/movie?with_genres=53&sort_by=vote_average.desc&vote_count.gte=500&region=US' },
];

const pageTracker = {};

    async function fetchMovies(endpoint, page = 1) {
      const fullEndpoint = endpoint.includes('?')
        ? `${BASE_URL}${endpoint}&page=${page}`
        : `${BASE_URL}${endpoint}?page=${page}`;
      const res = await fetch(`${fullEndpoint}&api_key=${API_KEY}`);
      const data = await res.json();
      return (data.results || []).filter(movie =>
        movie.original_language === 'en' &&
        movie.poster_path &&
        movie.backdrop_path
      );
    }

    async function getIMDbUrl(tmdbId) {
      if (imdbCache[tmdbId]) return imdbCache[tmdbId];
      try {
        const res = await fetch(`${BASE_URL}/movie/${tmdbId}/external_ids?api_key=${API_KEY}`);
        const data = await res.json();
        const url = data.imdb_id ? `https://www.imdb.com/title/${data.imdb_id}/` : '#';
        imdbCache[tmdbId] = url;
        return url;
      } catch {
        return '#';
      }
    }

    function getRowTemplate(row) {
      return `
        <div class="relative">
          <h2 class="text-2xl mb-3 font-semibold text-[var(--gold)]">${row.title}</h2>
          <div class="relative">
            <button onclick="scrollRow('${row.id}-scroll', -300)" class="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/60 hover:bg-black/80 text-[var(--gold)] rounded-full">&#x25C0;</button>
            <button onclick="scrollRow('${row.id}-scroll', 300)" class="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/60 hover:bg-black/80 text-[var(--gold)] rounded-full">&#x25B6;</button>
            <div id="${row.id}-scroll" class="flex space-x-4 overflow-x-auto scrollbar-hide scroll-smooth px-12 pb-2"></div>
          </div>
        </div>
      `;
    }

    async function buildRows() {
      for (const row of rows) {
        pageTracker[row.id] = 1;
        document.getElementById(row.id).innerHTML = getRowTemplate(row);
        await loadMore(row.id);
      }

      const topRated = await fetchMovies('/movie/top_rated');
      const pick = topRated[Math.floor(Math.random() * topRated.length)];
      const imdbUrl = await getIMDbUrl(pick.id);
      document.getElementById('banner-img').src = IMG_URL + pick.backdrop_path;
      document.getElementById('banner-title').innerHTML = `<a href="${imdbUrl}" target="_blank" class="hover:underline">${pick.title}</a>`;
      document.getElementById('banner-desc').innerText = pick.overview;

      updateLuckyBanner();
    }

    async function loadMore(rowId) {
      const row = rows.find(r => r.id === rowId);
      const scrollEl = document.getElementById(`${rowId}-scroll`);
      const page = ++pageTracker[rowId];

      const movies = await fetchMovies(row.endpoint, page);
      for (const movie of movies) {
        const imdbUrl = await getIMDbUrl(movie.id);
        const div = document.createElement('div');
        div.className = 'flex-shrink-0 w-[150px] text-center';
        div.innerHTML = `
          <a href="${imdbUrl}" target="_blank">
            <img src="${IMG_URL + movie.poster_path}" alt="${movie.title}" title="${movie.title}" class="w-full h-[220px] object-cover rounded-xl hover:scale-105 transition-transform duration-300 shadow-md" />
            <h3 class="text-sm mt-2 font-semibold truncate px-1 text-white hover:underline">${movie.title}</h3>
          </a>
          <p class="text-xs text-gray-300">⭐ ${movie.vote_average} | ${movie.release_date?.split('-')[0] || ''}</p>
        `;
        scrollEl.appendChild(div);
      }
    }

    function scrollRow(rowScrollId, amount) {
      const el = document.getElementById(rowScrollId);
      el.scrollBy({ left: amount, behavior: 'smooth' });
      setTimeout(() => {
        const scrollLeft = el.scrollLeft;
        const scrollWidth = el.scrollWidth;
        const clientWidth = el.clientWidth;
        if (scrollLeft + clientWidth >= scrollWidth - 100) {
          const rowId = rowScrollId.replace('-scroll', '');
          loadMore(rowId);
        }
      }, 400);
    }

    async function updateLuckyBanner() {
      const topRated = await fetchMovies('/movie/top_rated');
      const pick = topRated[Math.floor(Math.random() * topRated.length)];
      const imdbUrl = await getIMDbUrl(pick.id);
      document.getElementById('lucky-banner-img').src = IMG_URL + pick.backdrop_path;
      document.getElementById('lucky-banner-title').href = imdbUrl;
      document.getElementById('lucky-banner-title').innerText = pick.title;
    }

    const staticSections = {
      curator: [
        "Inglourious Basterds", "Django Unchained", "The Hateful Eight", "Fury", "Inception",
        "The Revenant", "Malignant", "Shutter Island", "Catch Me If You Can", "The Prestige",
        "Interstellar", "The Godfather", "The Departed", "Scarface", "Casino",
        "Top Gun: Maverick", "Pulp Fiction", "Reservoir Dogs", "Goodfellas", "Memento",
        "The Sixth Sense", "The Lord of the Rings", "The Usual Suspects", "Se7en", "Heat",
        "My Neighbor Totoro"
      ],
      rara: [
        "10 Things I Hate About You", "Twilight", "Maze Runner", "Harry Potter", "Pride and Prejudice",
        "Aladdin (1992)", "Breakfast at Tiffany's", "Mamma Mia", "The Notebook", "27 Dresses",
        "Dead Poets Society", "Casablanca", "Mr. & Mrs. Smith", "To All the Boys I've Loved Before",
        "How to Lose a Guy in 10 Days", "After", "Tangled", "Frozen", "Mean Girls",
        "13 Going on 30", "Love and Other Drugs", "The Hating Game", "Maleficent"
      ]
    };

    async function loadStaticMovies(sectionId, titles) {
      const container = document.getElementById(sectionId);
      container.innerHTML = getRowTemplate({ id: sectionId, title: sectionId === 'curator' ? "Curator's Pick" : "Rara Recommends" });
      const scrollEl = document.getElementById(`${sectionId}-scroll`);

      for (const title of titles) {
        const query = title === "Aladdin (1992)" ? "Aladdin&year=1992" : encodeURIComponent(title);
        const res = await fetch(`${BASE_URL}/search/movie?query=${query}&api_key=${API_KEY}`);
        const data = await res.json();
        const movie = data.results?.find(m => m.original_language === 'en' && m.poster_path);
        if (!movie) continue;

        const imdbUrl = await getIMDbUrl(movie.id);
        const div = document.createElement('div');
        div.className = 'flex-shrink-0 w-[150px] text-center';
        div.innerHTML = `
          <a href="${imdbUrl}" target="_blank">
            <img src="${IMG_URL + movie.poster_path}" alt="${movie.title}" class="w-full h-[220px] object-cover rounded-xl hover:scale-105 transition-transform duration-300 shadow-md" />
            <h3 class="text-sm mt-2 font-semibold truncate px-1 text-white hover:underline">${movie.title}</h3>
          </a>
          <p class="text-xs text-gray-300">⭐ ${movie.vote_average} | ${movie.release_date?.split('-')[0] || ''}</p>
        `;
        scrollEl.appendChild(div);
      }
    }

    buildRows().then(() => {
      loadStaticMovies('curator', staticSections.curator);
      loadStaticMovies('rara', staticSections.rara);
    });
