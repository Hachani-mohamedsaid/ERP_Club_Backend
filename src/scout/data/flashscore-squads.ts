/**
 * Effectifs curated style Flashscore — saison 2026-2027.
 * Priorité sur OpenAI (évite De Gea, Varane, etc.).
 */

import { normalizeClubName, rosterTeamId } from './league-rosters';
import { matchClubName } from './scout-geo-catalog';

export type FlashscorePlayerSeed = {
  name: string;
  position: string;
  age: number;
  nationality: string;
  potential: number;
  currentRating: number;
  marketValue: string;
};

type SquadEntry = {
  keys: string[];
  players: FlashscorePlayerSeed[];
};

const pos = {
  gb: (rows: [string, string, number, string, number, number, string][]) =>
    rows.map(([name, position, age, nationality, potential, currentRating, marketValue]) => ({
      name,
      position,
      age,
      nationality,
      potential,
      currentRating,
      marketValue,
    })),
};

const SQUADS: SquadEntry[] = [
  {
    keys: ['manu', 'gb-manchester-united', 'manchester united', 'man united'],
    players: pos.gb([
      ['André Onana', 'GB', 29, 'Cameroun', 82, 79, '18M €'],
      ['Altay Bayındır', 'GB', 27, 'Turquie', 78, 75, '8M €'],
      ['Matthijs de Ligt', 'DC', 26, 'Pays-Bas', 86, 82, '42M €'],
      ['Lisandro Martínez', 'DC', 27, 'Argentine', 85, 83, '45M €'],
      ['Harry Maguire', 'DC', 32, 'Angleterre', 78, 76, '15M €'],
      ['Leny Yoro', 'DC', 20, 'France', 88, 76, '55M €'],
      ['Noussair Mazraoui', 'DD', 28, 'Maroc', 82, 80, '28M €'],
      ['Diogo Dalot', 'DD', 26, 'Portugal', 80, 78, '22M €'],
      ['Luke Shaw', 'DG', 30, 'Angleterre', 79, 77, '18M €'],
      ['Patrick Dorgu', 'DG', 21, 'Danemark', 84, 76, '22M €'],
      ['Casemiro', 'MDC', 33, 'Brésil', 80, 78, '12M €'],
      ['Bruno Fernandes', 'MC', 31, 'Portugal', 90, 87, '70M €'],
      ['Kobbie Mainoo', 'MC', 20, 'Angleterre', 88, 82, '55M €'],
      ['Manuel Ugarte', 'MDC', 24, 'Uruguay', 84, 80, '38M €'],
      ['Mason Mount', 'MC', 26, 'Angleterre', 81, 78, '25M €'],
      ['Alejandro Garnacho', 'AG', 21, 'Argentine', 87, 82, '45M €'],
      ['Marcus Rashford', 'AG', 28, 'Angleterre', 85, 81, '40M €'],
      ['Rasmus Højlund', 'BU', 22, 'Danemark', 84, 79, '35M €'],
      ['Joshua Zirkzee', 'BU', 24, 'Pays-Bas', 83, 78, '28M €'],
      ['Amad Diallo', 'AD', 23, 'Côte d\'Ivoire', 82, 78, '22M €'],
    ]),
  },
  {
    keys: ['gb-manchester-city', 'city', 'manchester city'],
    players: pos.gb([
      ['Ederson', 'GB', 32, 'Brésil', 86, 84, '25M €'],
      ['Stefan Ortega', 'GB', 33, 'Allemagne', 76, 74, '6M €'],
      ['Rúben Dias', 'DC', 28, 'Portugal', 89, 87, '65M €'],
      ['John Stones', 'DC', 31, 'Angleterre', 85, 83, '38M €'],
      ['Josko Gvardiol', 'DC', 23, 'Croatie', 88, 84, '75M €'],
      ['Kyle Walker', 'DD', 35, 'Angleterre', 82, 80, '10M €'],
      ['Rico Lewis', 'DD', 21, 'Angleterre', 84, 79, '35M €'],
      ['Rodri', 'MDC', 29, 'Espagne', 92, 90, '110M €'],
      ['Kevin De Bruyne', 'MC', 34, 'Belgique', 90, 88, '45M €'],
      ['Phil Foden', 'MOC', 25, 'Angleterre', 91, 88, '110M €'],
      ['Bernardo Silva', 'MC', 31, 'Portugal', 88, 86, '70M €'],
      ['Erling Haaland', 'BU', 25, 'Norvège', 94, 92, '180M €'],
      ['Jeremy Doku', 'AG', 23, 'Belgique', 86, 83, '55M €'],
      ['Savinho', 'AD', 21, 'Brésil', 87, 82, '60M €'],
      ['Jack Grealish', 'AG', 30, 'Angleterre', 84, 81, '35M €'],
    ]),
  },
  {
    keys: ['liverpool', 'gb-liverpool'],
    players: pos.gb([
      ['Alisson', 'GB', 33, 'Brésil', 88, 86, '25M €'],
      ['Caoimhín Kelleher', 'GB', 27, 'Irlande', 80, 77, '12M €'],
      ['Virgil van Dijk', 'DC', 34, 'Pays-Bas', 90, 88, '45M €'],
      ['Ibrahima Konaté', 'DC', 26, 'France', 87, 85, '60M €'],
      ['Andrew Robertson', 'DG', 31, 'Écosse', 84, 82, '28M €'],
      ['Trent Alexander-Arnold', 'DD', 27, 'Angleterre', 88, 86, '70M €'],
      ['Alexis Mac Allister', 'MC', 26, 'Argentine', 87, 85, '65M €'],
      ['Dominik Szoboszlai', 'MC', 25, 'Hongrie', 86, 83, '55M €'],
      ['Curtis Jones', 'MC', 24, 'Angleterre', 83, 80, '35M €'],
      ['Mohamed Salah', 'AD', 33, 'Égypte', 92, 90, '80M €'],
      ['Luis Díaz', 'AG', 28, 'Colombie', 87, 85, '65M €'],
      ['Darwin Núñez', 'BU', 26, 'Uruguay', 86, 83, '55M €'],
      ['Cody Gakpo', 'BU', 26, 'Pays-Bas', 85, 82, '45M €'],
      ['Federico Chiesa', 'AD', 28, 'Italie', 85, 83, '40M €'],
    ]),
  },
  {
    keys: ['arsenal', 'gb-arsenal'],
    players: pos.gb([
      ['David Raya', 'GB', 30, 'Espagne', 84, 82, '35M €'],
      ['William Saliba', 'DC', 24, 'France', 90, 87, '80M €'],
      ['Gabriel Magalhães', 'DC', 28, 'Brésil', 87, 85, '55M €'],
      ['Ben White', 'DD', 28, 'Angleterre', 84, 82, '45M €'],
      ['Myles Lewis-Skelly', 'DG', 19, 'Angleterre', 86, 78, '40M €'],
      ['Declan Rice', 'MDC', 26, 'Angleterre', 89, 87, '110M €'],
      ['Martin Ødegaard', 'MOC', 26, 'Norvège', 90, 88, '90M €'],
      ['Mikel Merino', 'MC', 29, 'Espagne', 84, 82, '35M €'],
      ['Bukayo Saka', 'AD', 24, 'Angleterre', 92, 89, '120M €'],
      ['Gabriel Martinelli', 'AG', 24, 'Brésil', 87, 84, '65M €'],
      ['Kai Havertz', 'BU', 26, 'Allemagne', 85, 83, '55M €'],
      ['Leandro Trossard', 'AG', 31, 'Belgique', 82, 80, '22M €'],
    ]),
  },
  {
    keys: ['chelsea', 'gb-chelsea'],
    players: pos.gb([
      ['Robert Sánchez', 'GB', 28, 'Espagne', 82, 80, '25M €'],
      ['Wesley Fofana', 'DC', 24, 'France', 86, 82, '45M €'],
      ['Levi Colwill', 'DC', 22, 'Angleterre', 85, 81, '50M €'],
      ['Reece James', 'DD', 26, 'Angleterre', 86, 83, '45M €'],
      ['Malo Gusto', 'DD', 22, 'France', 83, 79, '28M €'],
      ['Enzo Fernández', 'MC', 24, 'Argentine', 88, 85, '90M €'],
      ['Moises Caicedo', 'MDC', 24, 'Équateur', 87, 84, '85M €'],
      ['Cole Palmer', 'MOC', 23, 'Angleterre', 91, 87, '100M €'],
      ['Pedro Neto', 'AD', 25, 'Portugal', 85, 82, '45M €'],
      ['Nicolas Jackson', 'BU', 24, 'Sénégal', 84, 80, '35M €'],
      ['Christopher Nkunku', 'BU', 28, 'France', 86, 83, '55M €'],
    ]),
  },
  {
    keys: ['gb-tottenham', 'tottenham'],
    players: pos.gb([
      ['Guglielmo Vicario', 'GB', 29, 'Italie', 84, 82, '30M €'],
      ['Cristian Romero', 'DC', 27, 'Argentine', 87, 85, '55M €'],
      ['Micky van de Ven', 'DC', 24, 'Pays-Bas', 86, 83, '50M €'],
      ['Pedro Porro', 'DD', 26, 'Espagne', 84, 82, '38M €'],
      ['Destiny Udogie', 'DG', 23, 'Italie', 85, 81, '40M €'],
      ['James Maddison', 'MOC', 29, 'Angleterre', 86, 84, '45M €'],
      ['Yves Bissouma', 'MDC', 29, 'Mali', 83, 81, '28M €'],
      ['Son Heung-min', 'AG', 33, 'Corée du Sud', 88, 86, '35M €'],
      ['Richarlison', 'BU', 28, 'Brésil', 82, 79, '25M €'],
      ['Brennan Johnson', 'AD', 24, 'Pays de Galles', 83, 80, '35M €'],
    ]),
  },
  {
    keys: ['gb-aston-villa', 'aston villa'],
    players: pos.gb([
      ['Emiliano Martínez', 'GB', 33, 'Argentine', 87, 85, '28M €'],
      ['Pau Torres', 'DC', 28, 'Espagne', 84, 82, '38M €'],
      ['Ezri Konsa', 'DC', 27, 'Angleterre', 82, 80, '28M €'],
      ['Matty Cash', 'DD', 27, 'Pologne', 81, 79, '22M €'],
      ['Lucas Digne', 'DG', 32, 'France', 80, 78, '12M €'],
      ['Youri Tielemans', 'MC', 28, 'Belgique', 84, 82, '35M €'],
      ['John McGinn', 'MC', 30, 'Écosse', 83, 81, '25M €'],
      ['Morgan Rogers', 'MOC', 22, 'Angleterre', 86, 82, '45M €'],
      ['Leon Bailey', 'AD', 28, 'Jamaïque', 82, 80, '28M €'],
      ['Ollie Watkins', 'BU', 29, 'Angleterre', 85, 83, '40M €'],
    ]),
  },
  {
    keys: ['gb-newcastle-united', 'newcastle united', 'newcastle'],
    players: pos.gb([
      ['Nick Pope', 'GB', 33, 'Angleterre', 83, 81, '18M €'],
      ['Fabian Schär', 'DC', 33, 'Suisse', 82, 80, '12M €'],
      ['Bruno Guimarães', 'MDC', 27, 'Brésil', 87, 85, '75M €'],
      ['Joelinton', 'MC', 28, 'Brésil', 82, 80, '35M €'],
      ['Sandro Tonali', 'MC', 25, 'Italie', 86, 83, '55M €'],
      ['Anthony Gordon', 'AG', 24, 'Angleterre', 86, 83, '60M €'],
      ['Alexander Isak', 'BU', 26, 'Suède', 89, 86, '90M €'],
      ['Harvey Barnes', 'AG', 27, 'Angleterre', 83, 81, '35M €'],
    ]),
  },
  {
    keys: ['gb-brighton', 'brighton'],
    players: pos.gb([
      ['Bart Verbruggen', 'GB', 23, 'Pays-Bas', 82, 78, '18M €'],
      ['Lewis Dunk', 'DC', 33, 'Angleterre', 80, 78, '10M €'],
      ['Joël Veltman', 'DD', 33, 'Pays-Bas', 78, 76, '8M €'],
      ['Pascal Groß', 'MC', 34, 'Allemagne', 81, 79, '12M €'],
      ['Carlos Baleba', 'MDC', 21, 'Cameroun', 84, 78, '35M €'],
      ['Georginio Rutter', 'BU', 22, 'France', 83, 79, '32M €'],
      ['Kaoru Mitoma', 'AG', 28, 'Japon', 84, 82, '38M €'],
      ['Yankuba Minteh', 'AD', 20, 'Gambie', 82, 76, '22M €'],
    ]),
  },
  {
    keys: ['gb-west-ham', 'west ham'],
    players: pos.gb([
      ['Alphonse Areola', 'GB', 32, 'France', 80, 78, '10M €'],
      ['Konstantinos Mavropanos', 'DC', 27, 'Grèce', 81, 79, '18M €'],
      ['Aaron Wan-Bissaka', 'DD', 27, 'Angleterre', 80, 78, '22M €'],
      ['Lucas Paquetá', 'MC', 27, 'Brésil', 84, 82, '45M €'],
      ['Tomáš Souček', 'MDC', 30, 'République tchèque', 82, 80, '25M €'],
      ['Jarrod Bowen', 'AD', 28, 'Angleterre', 85, 83, '45M €'],
      ['Niclas Füllkrug', 'BU', 32, 'Allemagne', 81, 79, '15M €'],
    ]),
  },
  {
    keys: ['gb-wolves', 'wolves'],
    players: pos.gb([
      ['José Sá', 'GB', 31, 'Portugal', 81, 79, '12M €'],
      ['Toti Gomes', 'DC', 26, 'Portugal', 80, 78, '18M €'],
      ['Matheus Cunha', 'BU', 26, 'Brésil', 85, 82, '55M €'],
      ['Jørgen Strand Larsen', 'BU', 25, 'Norvège', 82, 79, '28M €'],
      ['Hee-Chan Hwang', 'AG', 29, 'Corée du Sud', 80, 78, '18M €'],
      ['André', 'MDC', 24, 'Brésil', 83, 80, '35M €'],
    ]),
  },
  {
    keys: ['gb-brentford', 'brentford'],
    players: pos.gb([
      ['Mark Flekken', 'GB', 31, 'Pays-Bas', 78, 76, '8M €'],
      ['Nathan Collins', 'DC', 24, 'Irlande', 81, 79, '22M €'],
      ['Bryan Mbeumo', 'AD', 26, 'Cameroun', 84, 82, '45M €'],
      ['Yoane Wissa', 'BU', 29, 'RD Congo', 82, 80, '28M €'],
      ['Kevin Schade', 'AG', 23, 'Allemagne', 82, 78, '25M €'],
    ]),
  },
  {
    keys: ['gb-bournemouth', 'bournemouth'],
    players: pos.gb([
      ['Neto', 'GB', 35, 'Brésil', 79, 77, '5M €'],
      ['Dean Huijsen', 'DC', 20, 'Espagne', 84, 78, '35M €'],
      ['Antoine Semenyo', 'AD', 25, 'Ghana', 83, 80, '32M €'],
      ['Evanilson', 'BU', 25, 'Brésil', 82, 79, '28M €'],
      ['Justin Kluivert', 'MOC', 25, 'Pays-Bas', 81, 79, '22M €'],
    ]),
  },
  {
    keys: ['gb-crystal-palace', 'crystal palace'],
    players: pos.gb([
      ['Dean Henderson', 'GB', 28, 'Angleterre', 81, 79, '18M €'],
      ['Marc Guéhi', 'DC', 25, 'Angleterre', 84, 82, '45M €'],
      ['Eberechi Eze', 'MOC', 27, 'Angleterre', 86, 84, '55M €'],
      ['Jean-Philippe Mateta', 'BU', 28, 'France', 82, 80, '25M €'],
      ['Ismaïla Sarr', 'AD', 27, 'Sénégal', 83, 81, '28M €'],
    ]),
  },
  {
    keys: ['gb-everton', 'everton'],
    players: pos.gb([
      ['Jordan Pickford', 'GB', 31, 'Angleterre', 84, 82, '22M €'],
      ['James Tarkowski', 'DC', 32, 'Angleterre', 80, 78, '12M €'],
      ['Idrissa Gueye', 'MDC', 35, 'Sénégal', 79, 77, '5M €'],
      ['Dominic Calvert-Lewin', 'BU', 28, 'Angleterre', 80, 78, '18M €'],
      ['Beto', 'BU', 27, 'Portugal', 79, 77, '15M €'],
    ]),
  },
  {
    keys: ['gb-fulham', 'fulham'],
    players: pos.gb([
      ['Bernd Leno', 'GB', 33, 'Allemagne', 82, 80, '12M €'],
      ['João Palhinha', 'MDC', 30, 'Portugal', 83, 81, '35M €'],
      ['Andreas Pereira', 'MOC', 29, 'Brésil', 81, 79, '22M €'],
      ['Raúl Jiménez', 'BU', 34, 'Mexique', 80, 78, '8M €'],
      ['Rodrigo Muniz', 'BU', 24, 'Brésil', 79, 76, '12M €'],
    ]),
  },
  {
    keys: ['gb-nottingham-forest', 'nottingham forest'],
    players: pos.gb([
      ['Matz Sels', 'GB', 33, 'Belgique', 80, 78, '10M €'],
      ['Murillo', 'DC', 22, 'Brésil', 83, 79, '28M €'],
      ['Morgan Gibbs-White', 'MOC', 25, 'Angleterre', 84, 82, '45M €'],
      ['Chris Wood', 'BU', 33, 'Nouvelle-Zélande', 79, 77, '8M €'],
      ['Callum Hudson-Odoi', 'AG', 24, 'Angleterre', 81, 79, '22M €'],
    ]),
  },
  {
    keys: ['gb-leeds-united', 'leeds united', 'leeds'],
    players: pos.gb([
      ['Illan Meslier', 'GB', 25, 'France', 80, 78, '18M €'],
      ['Ethan Ampadu', 'DC', 25, 'Pays de Galles', 79, 77, '15M €'],
      ['Brenden Aaronson', 'MOC', 24, 'États-Unis', 80, 78, '18M €'],
      ['Wilfried Gnonto', 'AD', 22, 'Italie', 81, 78, '22M €'],
      ['Joël Piroe', 'BU', 26, 'Pays-Bas', 79, 77, '12M €'],
    ]),
  },
  {
    keys: ['gb-burnley', 'burnley'],
    players: pos.gb([
      ['James Trafford', 'GB', 22, 'Angleterre', 78, 75, '12M €'],
      ['Dara O\'Shea', 'DC', 26, 'Irlande', 77, 75, '8M €'],
      ['Josh Cullen', 'MDC', 29, 'Irlande', 76, 74, '6M €'],
      ['Lyle Foster', 'BU', 25, 'Afrique du Sud', 77, 75, '10M €'],
      ['Jacob Bruun Larsen', 'AG', 27, 'Danemark', 76, 74, '8M €'],
    ]),
  },
  {
    keys: ['gb-sunderland', 'sunderland'],
    players: pos.gb([
      ['Anthony Patterson', 'GB', 25, 'Angleterre', 76, 74, '5M €'],
      ['Luke O\'Nien', 'DC', 30, 'Angleterre', 74, 72, '2M €'],
      ['Patrick Roberts', 'AD', 28, 'Angleterre', 76, 74, '6M €'],
      ['Wilson Isidor', 'BU', 24, 'France', 77, 75, '10M €'],
      ['Enzo Le Fée', 'MC', 25, 'France', 78, 76, '12M €'],
    ]),
  },
  {
    keys: ['es-real-madrid', 'real madrid'],
    players: pos.gb([
      ['Thibaut Courtois', 'GB', 33, 'Belgique', 90, 88, '35M €'],
      ['Éder Militão', 'DC', 27, 'Brésil', 87, 85, '55M €'],
      ['Antonio Rüdiger', 'DC', 32, 'Allemagne', 86, 84, '25M €'],
      ['Federico Valverde', 'MC', 27, 'Uruguay', 90, 88, '120M €'],
      ['Jude Bellingham', 'MC', 22, 'Angleterre', 93, 90, '180M €'],
      ['Vinícius Jr', 'AG', 25, 'Brésil', 93, 91, '150M €'],
      ['Rodrygo', 'AD', 24, 'Brésil', 88, 86, '80M €'],
      ['Kylian Mbappé', 'BU', 27, 'France', 95, 93, '200M €'],
    ]),
  },
  {
    keys: ['es-barcelona', 'barcelona'],
    players: pos.gb([
      ['Marc-André ter Stegen', 'GB', 33, 'Allemagne', 87, 85, '25M €'],
      ['Ronald Araújo', 'DC', 26, 'Uruguay', 87, 85, '60M €'],
      ['Pau Cubarsí', 'DC', 18, 'Espagne', 88, 80, '45M €'],
      ['Pedri', 'MC', 22, 'Espagne', 91, 88, '100M €'],
      ['Gavi', 'MC', 21, 'Espagne', 89, 85, '90M €'],
      ['Lamine Yamal', 'AD', 18, 'Espagne', 92, 86, '120M €'],
      ['Raphinha', 'AG', 28, 'Brésil', 87, 85, '55M €'],
      ['Robert Lewandowski', 'BU', 37, 'Pologne', 86, 84, '15M €'],
    ]),
  },
  {
    keys: ['de-bayern-munich', 'bayern munich', 'bayern'],
    players: pos.gb([
      ['Manuel Neuer', 'GB', 39, 'Allemagne', 84, 82, '5M €'],
      ['Dayot Upamecano', 'DC', 26, 'France', 86, 84, '50M €'],
      ['Joshua Kimmich', 'MDC', 30, 'Allemagne', 88, 86, '60M €'],
      ['Jamal Musiala', 'MOC', 22, 'Allemagne', 92, 89, '130M €'],
      ['Harry Kane', 'BU', 32, 'Angleterre', 91, 89, '80M €'],
      ['Michael Olise', 'AD', 23, 'France', 88, 85, '70M €'],
      ['Serge Gnabry', 'AG', 30, 'Allemagne', 84, 82, '25M €'],
    ]),
  },
  {
    keys: ['de-borussia-dortmund', 'borussia dortmund', 'dortmund'],
    players: pos.gb([
      ['Gregor Kobel', 'GB', 28, 'Suisse', 85, 83, '35M €'],
      ['Mats Hummels', 'DC', 36, 'Allemagne', 82, 80, '8M €'],
      ['Julian Brandt', 'MOC', 29, 'Allemagne', 85, 83, '40M €'],
      ['Marcel Sabitzer', 'MC', 31, 'Autriche', 82, 80, '18M €'],
      ['Karim Adeyemi', 'AD', 23, 'Allemagne', 84, 81, '35M €'],
      ['Serhou Guirassy', 'BU', 29, 'Guinée', 86, 84, '45M €'],
    ]),
  },
  {
    keys: ['fr-paris-sg', 'paris sg', 'psg'],
    players: pos.gb([
      ['Gianluigi Donnarumma', 'GB', 26, 'Italie', 87, 85, '45M €'],
      ['Marquinhos', 'DC', 31, 'Brésil', 87, 85, '35M €'],
      ['Achraf Hakimi', 'DD', 26, 'Maroc', 88, 86, '70M €'],
      ['Vitinha', 'MC', 25, 'Portugal', 88, 86, '80M €'],
      ['Warren Zaïre-Emery', 'MC', 19, 'France', 89, 84, '75M €'],
      ['Ousmane Dembélé', 'AD', 28, 'France', 88, 86, '60M €'],
      ['Bradley Barcola', 'AG', 22, 'France', 86, 83, '55M €'],
      ['Randal Kolo Muani', 'BU', 27, 'France', 84, 82, '45M €'],
    ]),
  },
];

/** Génère effectif plausible pour clubs sans override (style Flashscore). */
function generateFallbackSquad(
  teamName: string,
  countryName: string,
  avgPotential: number,
): FlashscorePlayerSeed[] {
  const seed = normalizeClubName(teamName);
  const base = Math.max(68, avgPotential - 8);
  const templates: [string, string][] = [
    ['GB', 'GB'],
    ['DC', 'DC'],
    ['DC', 'DC'],
    ['DG', 'DG'],
    ['DD', 'DD'],
    ['MDC', 'MDC'],
    ['MC', 'MC'],
    ['MC', 'MC'],
    ['MOC', 'MOC'],
    ['AG', 'AG'],
    ['AD', 'AD'],
    ['BU', 'BU'],
    ['BU', 'BU'],
  ];
  const prefixes = ['Alex', 'Marco', 'Lucas', 'Omar', 'Diego', 'Hugo', 'Nico', 'Leo', 'Sam', 'Tom'];
  return templates.map(([position], i) => {
    const pot = Math.min(92, base + (i % 7) + (seed.charCodeAt(i % seed.length) % 5));
    const age = 19 + ((seed.charCodeAt(i % seed.length) + i * 3) % 14);
    return {
      name: `${prefixes[i % prefixes.length]} ${teamName.split(' ').pop()} ${i + 1}`,
      position,
      age,
      nationality: countryName,
      potential: pot,
      currentRating: Math.max(60, pot - 4),
      marketValue: pot >= 85 ? `${8 + (i % 5) * 3}M €` : `${400 + i * 120}K €`,
    };
  });
}

export function resolveFlashscoreSquad(
  teamId: string,
  teamName: string,
  countryId: string,
  countryName: string,
  avgPotential: number,
): FlashscorePlayerSeed[] {
  const idKey = teamId.toLowerCase();
  const nameKey = teamName.toLowerCase();
  const rosterId = rosterTeamId(countryId, teamName);

  for (const entry of SQUADS) {
    if (
      entry.keys.some(
        (k) =>
          k === idKey ||
          k === rosterId ||
          k === nameKey ||
          matchClubName(teamName, k) ||
          matchClubName(k, teamName),
      )
    ) {
      return entry.players;
    }
  }

  return generateFallbackSquad(teamName, countryName, avgPotential);
}

export function squadKeysForTeam(countryId: string, teamName: string) {
  return [rosterTeamId(countryId, teamName), teamName.toLowerCase()];
}
