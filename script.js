let NumberOfPokemonShowed = 20;
let pokemons = [];
let allPokemonDetails = [];
let filteredPokemons = [];
let currentPokemonIndex = 0;

document.addEventListener('DOMContentLoaded', () => {
    render();
    document.getElementById('searchInput').addEventListener('input', searchPokemon);
    document.addEventListener('keydown', handleKeyboardNavigation);
});

async function render() {
    const pokeLoader = document.getElementById('pokeLoader');
    pokeLoader.style.display = 'flex';
    allPokemonDetails = [];
    await loadPokemons();
    pokeLoader.style.display = 'none';
}

async function loadPokemons() {
    try {
        await fetchAndStorePokemons();
        await fetchPokemonDetails();
        renderPokemonCards(filteredPokemons);
    } catch (error) {
        console.error('Error loading Pokémon:', error);
    }
}

async function fetchAndStorePokemons() {
    const BASE_URL = `https://pokeapi.co/api/v2/pokemon?limit=${NumberOfPokemonShowed}&offset=0`;
    const response = await fetch(BASE_URL);
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    pokemons = data.results;

    pokemons.sort((a, b) => {
        const idA = extractPokemonId(a.url);
        const idB = extractPokemonId(b.url);
        return idA - idB;
    });
}

function extractPokemonId(url) {
    const matches = url.match(/\/(\d+)\//);
    return matches ? parseInt(matches[1]) : null;
}

async function fetchPokemonDetails() {
    try {
        for (let i = 0; i < pokemons.length; i++) {
            let response = await fetch(pokemons[i].url);
            if (response.ok) {
                let pokemonDetailsAsJSON = await response.json();
                if (!allPokemonDetails.some(pokemon => pokemon.id === pokemonDetailsAsJSON.id)) {
                    allPokemonDetails.push(pokemonDetailsAsJSON);
                }
            } else {
                console.log(`Fehler beim Abrufen der Details für Pokémon mit ID ${i}: ${response.status} ${response.statusText}`);
            }
        }

        allPokemonDetails.sort((a, b) => a.id - b.id);
        filteredPokemons = [...allPokemonDetails];
    } catch (error) {
        console.log(error);
    }
}

function generateHTMLPokemonCard(pokemonDetails, index) {
    const pokemonName = pokemonDetails.name;
    const typesHTML = generatePokemonTypesHTML(pokemonDetails.types);

    const pokemonId = String(pokemonDetails.id).padStart(3, '0');

    return `
        <div class="pokemonCard" onclick="openCard(${index})">
            <div class="pokemonTitle">
                <small>#${pokemonId}</small>
                <h2>${pokemonName}</h2>
            </div>
            <div class="pokemonImage ${getPrimaryTypeClass(pokemonDetails.types)}">
                <img class="pokemon-img" src="${pokemonDetails.sprites.other['official-artwork'].front_default}" alt="${pokemonName}">
            </div>
            <div class="pokemonTypes">
                ${typesHTML}
            </div>
        </div>`;
}

function generatePokemonTypesHTML(types) {
    return types.map(type => `<div class="pokemonType ${type.type.name}">${type.type.name}</div>`).join('');
}

function getPrimaryTypeClass(types) {
    return types.length > 0 ? types[0].type.name : '';
}

function loadMorePokemons() {
    NumberOfPokemonShowed += 20;
    render();
}

function searchPokemon(event) {
    const searchTerm = event.target.value.toLowerCase();
    filteredPokemons = allPokemonDetails.filter(pokemon => pokemon.name.toLowerCase().includes(searchTerm));

    renderPokemonCards(filteredPokemons);
}

function renderPokemonCards(pokemonList) {
    const content = document.getElementById('content');
    content.innerHTML = '';

    pokemonList.forEach((pokemon, index) => {
        const pokemonCardHTML = generateHTMLPokemonCard(pokemon, index);
        content.innerHTML += pokemonCardHTML;
    });
}

function openCard(index) {
    currentPokemonIndex = index;
    const pokemon = filteredPokemons[index];

    setPokemonCardImageAndName(pokemon);
    setPokemonCardTypeClass(pokemon);
    setupCardButtons(pokemon);

    showInfo(pokemon);

    const bigPokeCardContainer = document.getElementById('openPokemonCard');
    bigPokeCardContainer.classList.add('active');
}

function setPokemonCardImageAndName(pokemon) {
    const bigCardPokeImg = document.getElementById('bigCardPokeImg');
    const bigCardPokeName = document.getElementById('bigCardPokeName');

    bigCardPokeImg.src = pokemon.sprites.other['official-artwork'].front_default;
    bigCardPokeName.innerHTML = `<div class="pokeNumber">#${pokemon.id.toString().padStart(3, '0')}</div><div class="pokeName">${pokemon.name}</div>`;
}

function setPokemonCardTypeClass(pokemon) {
    const bigPokeCardImg = document.querySelector('.bigPokeCardImg');
    const typeClass = pokemon.types.length > 0 ? pokemon.types[0].type.name : '';
    bigPokeCardImg.className = `bigPokeCardImg typeBackground ${typeClass || ''}`;
}

function setupCardButtons(pokemon) {
    document.querySelectorAll('.buttonContainer button').forEach((button, idx) => {
        button.onclick = () => {
            if (idx === 0) {
                showInfo(pokemon);
            } else if (idx === 1) {
                showStats(pokemon);
            } else {
                showEvolution(pokemon);
            }
        };
    });

    document.body.style.overflow = 'hidden';
}


function showInfo(pokemon) {
    const bigCardPokeContent = document.getElementById('bigCardPokeContent');
    bigCardPokeContent.innerHTML = `
        <div class="infoLine">
            Type: ${pokemon.types.map(type => type.type.name).join(', ')}
        </div>
        <div class="infoLine">
            <img src="./img/gewicht.png" alt="Weight">
            Weight: ${pokemon.weight / 10} kg
        </div>
        <div class="infoLine">
            <img src="./img/height.png" alt="Height">
            Height: ${pokemon.height / 10} m
        </div>`;
}

async function showStats(pokemon) {
    const bigCardPokeContent = document.getElementById('bigCardPokeContent');
    bigCardPokeContent.innerHTML = `
        <div class="infoLine">HP: ${pokemon.stats[0].base_stat}</div>
        <div class="infoLine">Attack: ${pokemon.stats[1].base_stat} | Defense: ${pokemon.stats[2].base_stat}</div>
        <div class="infoLine">Special-Attack: ${pokemon.stats[3].base_stat}</div>
        <div class="infoLine">Special-Defense: ${pokemon.stats[4].base_stat}</div>
        <div class="infoLine">Speed: ${pokemon.stats[5].base_stat}</div>`;
}

async function showEvolution(pokemon) {
    const evolutionChain = await getEvolutionChain(pokemon);
    displayEvolution(evolutionChain);
}

async function getEvolutionChain(pokemon) {
    const speciesResponse = await fetch(pokemon.species.url);
    const speciesData = await speciesResponse.json();
    const evolutionChainUrl = speciesData.evolution_chain.url;

    const response = await fetch(evolutionChainUrl);
    const data = await response.json();
    const chain = data.chain;

    const evolutions = [];
    let currentStage = chain;
    while (currentStage) {
        const pokemonId = currentStage.species.url.split('/').slice(-2, -1)[0];
        evolutions.push({ id: pokemonId, name: currentStage.species.name });
        currentStage = currentStage.evolves_to[0];
    }

    return evolutions;
}

function displayEvolution(evolutionChain) {
    const bigCardPokeContent = document.getElementById('bigCardPokeContent');
    bigCardPokeContent.innerHTML = evolutionChain.map(pokemon => `
        <div class="infoLine">#${String(pokemon.id).padStart(3, '0')} ${pokemon.name}</div>
    `).join('');
}

function closeCard() {
    const bigPokeCardContainer = document.getElementById('openPokemonCard');
    bigPokeCardContainer.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function previousCard() {
    if (currentPokemonIndex === 0) {
        currentPokemonIndex = filteredPokemons.length - 1;
    } else {
        currentPokemonIndex--;
    }
    openCard(currentPokemonIndex);
}

function nextCard() {
    if (currentPokemonIndex === filteredPokemons.length - 1) {
        currentPokemonIndex = 0;
    } else {
        currentPokemonIndex++;
    }
    openCard(currentPokemonIndex);
}

function handleKeyboardNavigation(event) {
    switch (event.key) {
        case 'ArrowLeft':
            previousCard();
            break;
        case 'ArrowRight':
            nextCard();
            break;
        default:
            break;
    }
}
