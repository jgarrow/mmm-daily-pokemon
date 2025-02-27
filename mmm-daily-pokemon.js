/* global Module */

/* Magic Mirror
 * Module: mmm-daily-pokemon
 *
 * By
 * MIT Licensed.
 */

Module.register("mmm-daily-pokemon", {
	defaults: {
		updateInterval: 86400000, // 1 Day
		grayscale: true, // Turns pokemon image and type images gray to match magic mirror styles
		minPoke: 1, // Default to all pokemon
		maxPoke: 898, // Highest number - 802 pokemon currently exist
		showType: true, // Shows type icons below pokemon's image
		stats: true, // Displays pokemon stat table
		language: "en",
		genera: true, // Sub-description for the pokemon
		gbaMode: true, // Changes font to GBA style
		nameSize: 32, // Changes header size - px
		flavorText: false, // Displays flavor text for the pokemon
		useSprite: true, // if false, uses official artwork instead
		updateContentInterval: 30000, // how frequently content should change/rotate; default 30 seconds
		fadeSpeed: 4000 // speed of the update animation in ms; default = 4 seconds
	},

	requiresVersion: "2.1.0", // Required version of MagicMirror

	start: function() { // Setting up interval for refresh
		Log.info("Starting module: " + this.name);

		// Schedule update time to change which Pokemon is displayed
		setInterval(function() {
			this.updateDom();
		}, this.config.updateInterval);

		// Schedule update timer for rotating the content
		// setInterval(() => {
		// 	this.updateDom(this.config.fadeSpeed);
		// }, this.config.updateContentInterval);
	},

	query: function() {
		return {
			method: "POST",
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				query: `
				fragment PokemonEvolutionDataFragment on Pokemon {
					id
					name
					generation
					evolution_trigger
					evolution_criteria {
					  ... on Move {
						evolution_criteria_name
						name
					  }
					  ... on Item {
						id
						evolution_criteria_name
						name
						cost
						bag_pocket
						effect
						description
					  }
					  ... on Type {
						evolution_criteria_name
						name
					  }
					  ... on Location {
						evolution_criteria_name
						name
						region {
						  name
						}
						games {
						  name
						}
					  }
					  ... on Gender {
						evolution_criteria_name
						name
					  }
					  ... on OtherEvolutionCriteria {
						evolution_criteria_name
						value
					  }
					}
				  }
				  
				  fragment PokemonEvolutionFragment on Pokemon {
					evolves_to {
					  ...PokemonEvolutionDataFragment
					  evolves_from {
						...PokemonEvolutionDataFragment
					  }
					  evolves_to {
						...PokemonEvolutionDataFragment
						evolves_from {
						  ...PokemonEvolutionDataFragment
						}
						evolves_to {
						  ...PokemonEvolutionDataFragment
						  evolves_from {
							...PokemonEvolutionDataFragment
						  }
						  evolves_to {
							...PokemonEvolutionDataFragment
						  }
						}
					  }
					}
					evolves_from {
					  ...PokemonEvolutionDataFragment
					  evolves_to {
						...PokemonEvolutionDataFragment
						evolves_to {
						  ...PokemonEvolutionDataFragment
						  evolves_to {
							...PokemonEvolutionDataFragment
						  }
						}
					  }
					  evolves_from {
						...PokemonEvolutionDataFragment
						evolves_to {
						  ...PokemonEvolutionDataFragment
						  evolves_to {
							...PokemonEvolutionDataFragment
							evolves_to {
							  ...PokemonEvolutionDataFragment
							}
						  }
						}
						evolves_from {
						  ...PokemonEvolutionDataFragment
						  evolves_to {
							...PokemonEvolutionDataFragment
							evolves_to {
							  ...PokemonEvolutionDataFragment
							  evolves_to {
								...PokemonEvolutionDataFragment
							  }
							}
						  }
						  evolves_from {
							...PokemonEvolutionDataFragment
						  }
						}
					  }
					}
				  }
				  
				  query Query($pokemonId: Int!) {
					pokemon(id: $pokemonId) {
					  id
					  name
					  genus
					  nat_dex_num
					  sprites {
						front_default
					  }
					  base_stats {
						hp
						attack
						defense
						special_attack
						special_defense
						speed
					  }
					  types {
						id
						name
					  }
					  pokedex_entries {
						description
					  }
					  abilities {
						id
						name
					  }
					  egg_groups {
						id
						name
					  }
					  ...PokemonEvolutionDataFragment
					  ...PokemonEvolutionFragment
					}
				  }
				`,
				variables: {
					pokemonId: Math.floor(Math.random() * (this.config.maxPoke - this.config.minPoke) + this.config.minPoke) // get random pokemon
				}
			})
		}
	},

	getDom: async function() { // Creating initial div
		const wrapper = document.createElement("div");
		wrapper.id = "poke-wrapper";

		if (this.config.stats === true){
			wrapper.style.width = "400px";
		} else {
			wrapper.style.width = "250px";
		}

		const header = document.createElement("h4");
		header.innerHTML = "Daily Pokemon";
		header.id = "poke-header";

		//wrapper.appendChild(header);
		const datum = await this.getData(); // Send request
		Log.log(datum)
		return wrapper;
	},

	getData: function(wrapper) { // Sends XHTTPRequest
		const self = this;

		fetch('https://dex-server.herokuapp.com/', this.query()).then(res => res.json()).then(results => self.createContent(results, wrapper));
	},

	createContent: function({data}, wrapper) { // Creates the elements for display
		Log.info('data: ', data)
		const {id, name, stats, types} = data.pokemon;

		// const bodyEl = document.getElementById('body');
		// bodyEl.style.fontFamily = this.config.gbaMode ? "'pokegb'" : "'Montserrat'";

		const pokeWrapper = document.createElement("div");
		pokeWrapper.style.fontFamily = this.config.gbaMode ? "'pokegb'" : "'Montserrat'";
		pokeWrapper.id = "poke-info";
		const flexWrapper = document.createElement("div");
		flexWrapper.id = "flex-wrapper";
		const pokeName = document.createElement("p");
		// TODO - maybe add an option to get rid of Pokedex #
		pokeName.innerHTML = name.charAt(0).toUpperCase() + name.slice(1) + "<br />" + "#" + id;
		pokeName.id = "poke-name";

		// Font size/style modification
		if (this.config.nameSize != 32) {
			pokeName.style.cssText = "font-size:" + this.config.nameSize + "px;";
		} else if (this.config.nameSize == 32 && this.config.gbaMode) { // Changing default size if gbaMode is enabled without size changes added
			pokeName.style.cssText = "font-size: 22px;";
		}

		wrapper.appendChild(pokeName);

		if(this.config.genera){
			const pokeSubName = document.createElement("p");
			// TODO - maybe add an option to get rid of Pokedex #
			pokeSubName.id = "poke-subname";
			wrapper.appendChild(pokeSubName);
		}

		const pokePicWrapper = document.createElement("div");
		pokePicWrapper.id = "img-wrapper";
		const pokePic = document.createElement("img");
		pokePic.src = this.config.useSprite ? data.sprites.front_default : `https://dex-images.s3-us-west-1.amazonaws.com/img/${id}.png`;
		pokePic.id = "poke-pic";

		if (this.config.grayscale) {
			pokePic.id = "poke-pic-grayscale";
		}

		pokePicWrapper.appendChild(pokePic);
		pokeWrapper.appendChild(pokePicWrapper);

		const typesContainer = document.createElement("div");
		typesContainer.id = "poke-types";

		types.forEach(({type}, i) => {
			const typeImgWrapper = document.createElement("div");
			typeImgWrapper.className = "type-img-wrapper"
			const typeImg = document.createElement("img");
			typeImg.src = this.file("images/type-icons/" + type.name[0].toUpperCase() + type.name.slice(1).toLowerCase() + "_icon_SwSh.png");

			if (this.config.grayscale) {
				typeImg.className = "poke-pic-grayscale-type";
			}

			typeImgWrapper.appendChild(typeImg);
			typesContainer.appendChild(typeImgWrapper);
		})

		typesContainer.style.justifyContent = types.length > 1 ? "space-evenly" : "center";

		pokeWrapper.appendChild(typesContainer);
		flexWrapper.appendChild(pokeWrapper);

		statWrapper = document.createElement("div");
		// TODO - Add in a stats table
		if (this.config.stats){
			const statTable = document.createElement("table");

			for (let i = 5; i >= 0; i--) {//Inverted to list stats in right order
				const tr = document.createElement("tr");
				const tdName = document.createElement("td");
				const tdStat = document.createElement("td");

				tdName.innerHTML = this.translate(stats[i].stat.name);
				tdStat.innerHTML = stats[i].base_stat;

				tr.appendChild(tdName);
				tr.appendChild(tdStat);
				statTable.appendChild(tr);
			}

			statWrapper.appendChild(statTable);
			flexWrapper.appendChild(statWrapper);
		}

		wrapper.appendChild(flexWrapper);

		if (this.config.flavorText) {
			const flavorTextWrapper = document.createElement("div");
			flavorTextWrapper.id = "flavor-text-wrapper";

			const flavorText = document.createElement("p");
			flavorText.innerHTML = data?.flavorTextDisplay || "";
			flavorText.id = "flavor-text";

			flavorText.style.fontSize = "24px";
			flavorText.style.lineHeight = "1.5";

			if (this.config.gbaMode) {
				flavorText.style.fontSize = "18px";
			}

			flavorTextWrapper.appendChild(flavorText);
			wrapper.appendChild(flavorTextWrapper);
		}
	},

	getStyles: function() {
		return [this.file('mmm-daily-pokemon.css')]
	},

	getTranslations: function() {
		return {
			en: "translations/en.json",
			fr: "translations/fr.json"
		}
	}
});
