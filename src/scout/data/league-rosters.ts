/** Clubs complets par championnat (division 1, saison récente). */

type RosterClub = {
  name: string;
  city: string;
  avgPotential?: number;
  scoutActivity?: 'Haute' | 'Moyenne' | 'Faible';
  logoColor?: string;
};

type CountryRoster = {
  league: string;
  leagueId: string;
  teams: RosterClub[];
};

function slug(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

export function rosterTeamId(countryId: string, name: string) {
  return `${countryId}-${slug(name)}`;
}

export const LEAGUE_ROSTERS: Record<string, CountryRoster> = {
  gb: {
    league: 'Premier League',
    leagueId: 'pl-eng',
    teams: [
      { name: 'Arsenal', city: 'Londres', avgPotential: 87, logoColor: 'EF0107' },
      { name: 'Aston Villa', city: 'Birmingham', avgPotential: 84, logoColor: '95BFE5' },
      { name: 'Bournemouth', city: 'Bournemouth', avgPotential: 78, logoColor: 'DA020E' },
      { name: 'Brentford', city: 'Londres', avgPotential: 79, logoColor: 'E30613' },
      { name: 'Brighton', city: 'Brighton', avgPotential: 81, logoColor: '0057B8' },
      { name: 'Chelsea', city: 'Londres', avgPotential: 86, logoColor: '034694' },
      { name: 'Crystal Palace', city: 'Londres', avgPotential: 77, logoColor: '1B458F' },
      { name: 'Everton', city: 'Liverpool', avgPotential: 76, logoColor: '003399' },
      { name: 'Fulham', city: 'Londres', avgPotential: 77, logoColor: 'FFFFFF' },
      { name: 'Ipswich Town', city: 'Ipswich', avgPotential: 74, logoColor: '003399' },
      { name: 'Leicester City', city: 'Leicester', avgPotential: 75, logoColor: '003090' },
      { name: 'Liverpool', city: 'Liverpool', avgPotential: 88, logoColor: 'C8102E' },
      { name: 'Manchester City', city: 'Manchester', avgPotential: 89, logoColor: '6CABDD' },
      { name: 'Manchester United', city: 'Manchester', avgPotential: 85, logoColor: 'DA020E' },
      { name: 'Newcastle United', city: 'Newcastle', avgPotential: 83, logoColor: '241F20' },
      { name: 'Nottingham Forest', city: 'Nottingham', avgPotential: 76, logoColor: 'DD0000' },
      { name: 'Southampton', city: 'Southampton', avgPotential: 74, logoColor: 'D71920' },
      { name: 'Tottenham', city: 'Londres', avgPotential: 84, logoColor: '132257' },
      { name: 'West Ham', city: 'Londres', avgPotential: 78, logoColor: '7A263A' },
      { name: 'Wolves', city: 'Wolverhampton', avgPotential: 77, logoColor: 'FDB913' },
    ],
  },
  es: {
    league: 'La Liga',
    leagueId: 'laliga',
    teams: [
      { name: 'Alavés', city: 'Vitoria', avgPotential: 74, logoColor: '0055A4' },
      { name: 'Athletic Bilbao', city: 'Bilbao', avgPotential: 82, logoColor: 'EE2523' },
      { name: 'Atlético Madrid', city: 'Madrid', avgPotential: 86, logoColor: 'CB3524' },
      { name: 'Barcelona', city: 'Barcelone', avgPotential: 89, logoColor: 'A50044' },
      { name: 'Betis', city: 'Séville', avgPotential: 80, logoColor: '00954C' },
      { name: 'Celta Vigo', city: 'Vigo', avgPotential: 76, logoColor: '8AC3EE' },
      { name: 'Espanyol', city: 'Barcelone', avgPotential: 75, logoColor: '007FC8' },
      { name: 'Getafe', city: 'Madrid', avgPotential: 74, logoColor: '005999' },
      { name: 'Girona', city: 'Gérone', avgPotential: 79, logoColor: 'CE1126' },
      { name: 'Las Palmas', city: 'Las Palmas', avgPotential: 73, logoColor: 'FFE114' },
      { name: 'Leganés', city: 'Leganés', avgPotential: 72, logoColor: '0055A4' },
      { name: 'Mallorca', city: 'Palma', avgPotential: 75, logoColor: 'E20613' },
      { name: 'Osasuna', city: 'Pampelune', avgPotential: 76, logoColor: 'D91A21' },
      { name: 'Rayo Vallecano', city: 'Madrid', avgPotential: 74, logoColor: 'E30613' },
      { name: 'Real Madrid', city: 'Madrid', avgPotential: 90, logoColor: 'FEBE10' },
      { name: 'Real Sociedad', city: 'Saint-Sébastien', avgPotential: 81, logoColor: '0055A4' },
      { name: 'Sevilla', city: 'Séville', avgPotential: 80, logoColor: 'FFFFFF' },
      { name: 'Valencia', city: 'Valence', avgPotential: 78, logoColor: 'FF6600' },
      { name: 'Valladolid', city: 'Valladolid', avgPotential: 72, logoColor: '6A1B9A' },
      { name: 'Villarreal', city: 'Villarreal', avgPotential: 82, logoColor: 'FFE114' },
    ],
  },
  fr: {
    league: 'Ligue 1',
    leagueId: 'l1-fr',
    teams: [
      { name: 'Angers', city: 'Angers', avgPotential: 72, logoColor: '000000' },
      { name: 'Auxerre', city: 'Auxerre', avgPotential: 73, logoColor: '003DA5' },
      { name: 'Brest', city: 'Brest', avgPotential: 76, logoColor: 'E30613' },
      { name: 'Le Havre', city: 'Le Havre', avgPotential: 73, logoColor: '0055A4' },
      { name: 'Lens', city: 'Lens', avgPotential: 80, logoColor: 'FFD700' },
      { name: 'Lille', city: 'Lille', avgPotential: 81, logoColor: 'E30613' },
      { name: 'Lyon', city: 'Lyon', avgPotential: 85, logoColor: '0055A4' },
      { name: 'Marseille', city: 'Marseille', avgPotential: 84, logoColor: '00A1E4' },
      { name: 'Monaco', city: 'Monaco', avgPotential: 83, logoColor: 'E30613' },
      { name: 'Montpellier', city: 'Montpellier', avgPotential: 76, logoColor: '0055A4' },
      { name: 'Nantes', city: 'Nantes', avgPotential: 77, logoColor: 'FFD700' },
      { name: 'Nice', city: 'Nice', avgPotential: 79, logoColor: 'E30613' },
      { name: 'Paris SG', city: 'Paris', avgPotential: 88, logoColor: '004170' },
      { name: 'Reims', city: 'Reims', avgPotential: 75, logoColor: 'E30613' },
      { name: 'Rennes', city: 'Rennes', avgPotential: 78, logoColor: 'E30613' },
      { name: 'Saint-Étienne', city: 'Saint-Étienne', avgPotential: 74, logoColor: '008000' },
      { name: 'Strasbourg', city: 'Strasbourg', avgPotential: 76, logoColor: '0055A4' },
      { name: 'Toulouse', city: 'Toulouse', avgPotential: 77, logoColor: '5D2E8C' },
    ],
  },
  de: {
    league: 'Bundesliga',
    leagueId: 'bundesliga',
    teams: [
      { name: 'Augsburg', city: 'Augsbourg', avgPotential: 74, logoColor: 'BA3733' },
      { name: 'Bayer Leverkusen', city: 'Leverkusen', avgPotential: 86, logoColor: 'E32221' },
      { name: 'Bayern Munich', city: 'Munich', avgPotential: 90, logoColor: 'DC052D' },
      { name: 'Bochum', city: 'Bochum', avgPotential: 72, logoColor: '0055A4' },
      { name: 'Borussia Dortmund', city: 'Dortmund', avgPotential: 87, logoColor: 'FDE100' },
      { name: 'Eintracht Frankfurt', city: 'Francfort', avgPotential: 80, logoColor: 'E1000F' },
      { name: 'Freiburg', city: 'Fribourg', avgPotential: 78, logoColor: 'E30613' },
      { name: 'Heidenheim', city: 'Heidenheim', avgPotential: 71, logoColor: 'E30613' },
      { name: 'Hoffenheim', city: 'Sinsheim', avgPotential: 77, logoColor: '0055A4' },
      { name: 'Holstein Kiel', city: 'Kiel', avgPotential: 70, logoColor: '0055A4' },
      { name: 'Mainz', city: 'Mayence', avgPotential: 75, logoColor: 'E30613' },
      { name: 'Mönchengladbach', city: 'Mönchengladbach', avgPotential: 76, logoColor: '000000' },
      { name: 'RB Leipzig', city: 'Leipzig', avgPotential: 84, logoColor: 'DD0741' },
      { name: 'St. Pauli', city: 'Hambourg', avgPotential: 73, logoColor: '8B4513' },
      { name: 'Stuttgart', city: 'Stuttgart', avgPotential: 79, logoColor: 'E30613' },
      { name: 'Union Berlin', city: 'Berlin', avgPotential: 75, logoColor: 'E30613' },
      { name: 'Werder Bremen', city: 'Brême', avgPotential: 76, logoColor: '1D9053' },
      { name: 'Wolfsburg', city: 'Wolfsburg', avgPotential: 77, logoColor: '65B32E' },
    ],
  },
  it: {
    league: 'Serie A',
    leagueId: 'serie-a-it',
    teams: [
      { name: 'Atalanta', city: 'Bergame', avgPotential: 82, logoColor: '1D4ED8' },
      { name: 'Bologna', city: 'Bologne', avgPotential: 79, logoColor: 'A21C26' },
      { name: 'Cagliari', city: 'Cagliari', avgPotential: 73, logoColor: 'A21C26' },
      { name: 'Como', city: 'Côme', avgPotential: 72, logoColor: '0055A4' },
      { name: 'Empoli', city: 'Empoli', avgPotential: 74, logoColor: '0055A4' },
      { name: 'Fiorentina', city: 'Florence', avgPotential: 78, logoColor: '5D2E8C' },
      { name: 'Genoa', city: 'Gênes', avgPotential: 74, logoColor: 'A21C26' },
      { name: 'Inter Milan', city: 'Milan', avgPotential: 88, logoColor: '010E80' },
      { name: 'Juventus', city: 'Turin', avgPotential: 86, logoColor: 'FFFFFF' },
      { name: 'Lazio', city: 'Rome', avgPotential: 80, logoColor: '87CEEB' },
      { name: 'Lecce', city: 'Lecce', avgPotential: 72, logoColor: 'FFD700' },
      { name: 'AC Milan', city: 'Milan', avgPotential: 87, logoColor: 'FB090B' },
      { name: 'Monza', city: 'Monza', avgPotential: 73, logoColor: 'E30613' },
      { name: 'Napoli', city: 'Naples', avgPotential: 85, logoColor: '12A0D7' },
      { name: 'Parma', city: 'Parme', avgPotential: 74, logoColor: 'FFD700' },
      { name: 'Roma', city: 'Rome', avgPotential: 83, logoColor: '8B0000' },
      { name: 'Torino', city: 'Turin', avgPotential: 76, logoColor: '8B0000' },
      { name: 'Udinese', city: 'Udine', avgPotential: 75, logoColor: 'FFFFFF' },
      { name: 'Venezia', city: 'Venise', avgPotential: 71, logoColor: 'FF6600' },
      { name: 'Verona', city: 'Vérone', avgPotential: 73, logoColor: 'FFD700' },
    ],
  },
  pt: {
    league: 'Liga Portugal',
    leagueId: 'liga-pt',
    teams: [
      { name: 'Arouca', city: 'Arouca', avgPotential: 71, logoColor: 'FFD700' },
      { name: 'AVS', city: 'Vila das Aves', avgPotential: 70, logoColor: '0055A4' },
      { name: 'Benfica', city: 'Lisbonne', avgPotential: 85, logoColor: 'DC2626' },
      { name: 'Boavista', city: 'Porto', avgPotential: 72, logoColor: '000000' },
      { name: 'Braga', city: 'Braga', avgPotential: 80, logoColor: 'E30613' },
      { name: 'Casa Pia', city: 'Lisbonne', avgPotential: 71, logoColor: 'FFD700' },
      { name: 'Estoril', city: 'Estoril', avgPotential: 72, logoColor: 'FFD700' },
      { name: 'Famalicão', city: 'Vila Nova de Famalicão', avgPotential: 73, logoColor: '0055A4' },
      { name: 'Farense', city: 'Faro', avgPotential: 70, logoColor: 'FFFFFF' },
      { name: 'Gil Vicente', city: 'Barcelos', avgPotential: 71, logoColor: 'E30613' },
      { name: 'Moreirense', city: 'Moreira de Cónegos', avgPotential: 72, logoColor: '0055A4' },
      { name: 'Nacional', city: 'Funchal', avgPotential: 71, logoColor: '000000' },
      { name: 'Porto', city: 'Porto', avgPotential: 84, logoColor: '00428C' },
      { name: 'Rio Ave', city: 'Vila do Conde', avgPotential: 72, logoColor: '0055A4' },
      { name: 'Santa Clara', city: 'Ponta Delgada', avgPotential: 71, logoColor: 'E30613' },
      { name: 'Sporting CP', city: 'Lisbonne', avgPotential: 84, logoColor: '008000' },
      { name: 'Estrela Amadora', city: 'Amadora', avgPotential: 70, logoColor: 'FFD700' },
      { name: 'Vitória Guimarães', city: 'Guimarães', avgPotential: 74, logoColor: 'FFFFFF' },
    ],
  },
  nl: {
    league: 'Eredivisie',
    leagueId: 'eredivisie',
    teams: [
      { name: 'Ajax', city: 'Amsterdam', avgPotential: 84, logoColor: 'D2122E' },
      { name: 'Almere City', city: 'Almere', avgPotential: 70, logoColor: 'E30613' },
      { name: 'AZ Alkmaar', city: 'Alkmaar', avgPotential: 78, logoColor: 'E30613' },
      { name: 'Feyenoord', city: 'Rotterdam', avgPotential: 82, logoColor: 'E30613' },
      { name: 'Fortuna Sittard', city: 'Sittard', avgPotential: 71, logoColor: 'FFD700' },
      { name: 'Go Ahead Eagles', city: 'Deventer', avgPotential: 72, logoColor: 'E30613' },
      { name: 'Groningen', city: 'Groningue', avgPotential: 73, logoColor: '0055A4' },
      { name: 'Heerenveen', city: 'Heerenveen', avgPotential: 74, logoColor: '0055A4' },
      { name: 'Heracles', city: 'Almelo', avgPotential: 71, logoColor: '000000' },
      { name: 'NAC Breda', city: 'Breda', avgPotential: 72, logoColor: 'FFD700' },
      { name: 'NEC', city: 'Nimègue', avgPotential: 73, logoColor: 'E30613' },
      { name: 'PSV', city: 'Eindhoven', avgPotential: 83, logoColor: 'ED1C24' },
      { name: 'RKC Waalwijk', city: 'Waalwijk', avgPotential: 70, logoColor: 'FFD700' },
      { name: 'Sparta Rotterdam', city: 'Rotterdam', avgPotential: 72, logoColor: 'E30613' },
      { name: 'Twente', city: 'Enschede', avgPotential: 77, logoColor: 'E30613' },
      { name: 'Utrecht', city: 'Utrecht', avgPotential: 76, logoColor: 'E30613' },
      { name: 'Willem II', city: 'Tilburg', avgPotential: 72, logoColor: '0055A4' },
      { name: 'Zwolle', city: 'Zwolle', avgPotential: 71, logoColor: '0055A4' },
    ],
  },
  be: {
    league: 'Pro League',
    leagueId: 'pro-league-be',
    teams: [
      { name: 'Anderlecht', city: 'Bruxelles', avgPotential: 79, logoColor: '4B0082' },
      { name: 'Antwerp', city: 'Anvers', avgPotential: 78, logoColor: 'E30613' },
      { name: 'Beerschot', city: 'Anvers', avgPotential: 72, logoColor: '8B4513' },
      { name: 'Cercle Brugge', city: 'Bruges', avgPotential: 74, logoColor: '0055A4' },
      { name: 'Charleroi', city: 'Charleroi', avgPotential: 73, logoColor: '000000' },
      { name: 'Club Brugge', city: 'Bruges', avgPotential: 80, logoColor: '007BC1' },
      { name: 'Dender', city: 'Denderleeuw', avgPotential: 70, logoColor: '0055A4' },
      { name: 'Genk', city: 'Genk', avgPotential: 77, logoColor: '0055A4' },
      { name: 'Gent', city: 'Gand', avgPotential: 76, logoColor: '0055A4' },
      { name: 'Kortrijk', city: 'Courtrai', avgPotential: 71, logoColor: 'E30613' },
      { name: 'Leuven', city: 'Louvain', avgPotential: 72, logoColor: '0055A4' },
      { name: 'Mechelen', city: 'Malines', avgPotential: 73, logoColor: 'FFD700' },
      { name: 'Sint-Truiden', city: 'Saint-Trond', avgPotential: 72, logoColor: 'FFD700' },
      { name: 'Standard Liège', city: 'Liège', avgPotential: 75, logoColor: 'E30613' },
      { name: 'Union SG', city: 'Bruxelles', avgPotential: 78, logoColor: 'FFD700' },
      { name: 'Westerlo', city: 'Westerlo', avgPotential: 71, logoColor: 'FFD700' },
    ],
  },
  tn: {
    league: 'Ligue 1 TUN',
    leagueId: 'l1-tun',
    teams: [
      { name: 'AS Ariana', city: 'Ariana', avgPotential: 76, scoutActivity: 'Haute', logoColor: 'FF7A00' },
      { name: 'AS Gabès', city: 'Gabès', avgPotential: 72, logoColor: 'FFD700' },
      { name: 'AS Soliman', city: 'Soliman', avgPotential: 71, logoColor: '0055A4' },
      { name: 'CA Bizertin', city: 'Bizerte', avgPotential: 74, logoColor: 'FFD700' },
      { name: 'Club Africain', city: 'Tunis', avgPotential: 80, scoutActivity: 'Haute', logoColor: 'DC2626' },
      { name: 'CS Sfaxien', city: 'Sfax', avgPotential: 79, scoutActivity: 'Moyenne', logoColor: '1D4ED8' },
      { name: 'ES Sahel', city: 'Sousse', avgPotential: 82, scoutActivity: 'Haute', logoColor: 'DC2626' },
      { name: 'ES Métlaoui', city: 'Métlaoui', avgPotential: 71, logoColor: '0055A4' },
      { name: 'JS Kairouan', city: 'Kairouan', avgPotential: 72, logoColor: 'FFFFFF' },
      { name: 'JS Omrane', city: 'Tunis', avgPotential: 73, logoColor: '0055A4' },
      { name: 'OC Kerkennah', city: 'Kerkennah', avgPotential: 70, logoColor: '0055A4' },
      { name: 'Olympique Béja', city: 'Béja', avgPotential: 73, logoColor: 'FFD700' },
      { name: 'Stade Tunisien', city: 'Tunis', avgPotential: 84, scoutActivity: 'Haute', logoColor: '2563EB' },
      { name: 'US Monastir', city: 'Monastir', avgPotential: 78, scoutActivity: 'Moyenne', logoColor: '059669' },
      { name: 'US Tataouine', city: 'Tataouine', avgPotential: 71, logoColor: 'FFD700' },
      { name: 'Étoile du Sahel', city: 'Sousse', avgPotential: 81, scoutActivity: 'Haute', logoColor: 'DC2626' },
    ],
  },
  tr: {
    league: 'Süper Lig',
    leagueId: 'super-lig',
    teams: [
      { name: 'Adana Demirspor', city: 'Adana', avgPotential: 72, logoColor: '0055A4' },
      { name: 'Alanyaspor', city: 'Alanya', avgPotential: 73, logoColor: 'FFD700' },
      { name: 'Antalyaspor', city: 'Antalya', avgPotential: 74, logoColor: 'E30613' },
      { name: 'Başakşehir', city: 'Istanbul', avgPotential: 77, logoColor: '0055A4' },
      { name: 'Beşiktaş', city: 'Istanbul', avgPotential: 80, logoColor: '000000' },
      { name: 'Bodrum FK', city: 'Bodrum', avgPotential: 70, logoColor: '0055A4' },
      { name: 'Eyüpspor', city: 'Istanbul', avgPotential: 71, logoColor: 'FFD700' },
      { name: 'Fenerbahçe', city: 'Istanbul', avgPotential: 81, logoColor: 'FFED00' },
      { name: 'Galatasaray', city: 'Istanbul', avgPotential: 82, logoColor: 'FFD700' },
      { name: 'Gaziantep FK', city: 'Gaziantep', avgPotential: 72, logoColor: 'E30613' },
      { name: 'Göztepe', city: 'Izmir', avgPotential: 73, logoColor: 'FFD700' },
      { name: 'Hatayspor', city: 'Antakya', avgPotential: 71, logoColor: '8B0000' },
      { name: 'Kasımpaşa', city: 'Istanbul', avgPotential: 72, logoColor: '0055A4' },
      { name: 'Kayserispor', city: 'Kayseri', avgPotential: 72, logoColor: 'FFD700' },
      { name: 'Konyaspor', city: 'Konya', avgPotential: 73, logoColor: '008000' },
      { name: 'Rizespor', city: 'Rize', avgPotential: 71, logoColor: '0055A4' },
      { name: 'Samsunspor', city: 'Samsun', avgPotential: 73, logoColor: 'E30613' },
      { name: 'Sivasspor', city: 'Sivas', avgPotential: 72, logoColor: 'E30613' },
      { name: 'Trabzonspor', city: 'Trabzon', avgPotential: 78, logoColor: '8B0000' },
    ],
  },
};

export function normalizeClubName(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/fc|cf|ac|sc|us|as|js|es|ca|ol|om/gi, '')
    .replace(/[^a-z0-9]/g, '');
}
