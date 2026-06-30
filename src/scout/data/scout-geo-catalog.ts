export interface GeoContinent {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface GeoCountry {
  id: string;
  continentId: string;
  name: string;
  flag: string;
  flagCode: string;
  color: string;
  leagues: string[];
  leagueId: string;
}

export interface GeoTeam {
  id: string;
  countryId: string;
  name: string;
  league: string;
  leagueId: string;
  city: string;
  tier: 'Pro' | 'D2' | 'Elite';
  avgPotential: number;
  scoutActivity: 'Haute' | 'Moyenne' | 'Faible';
  logoColor?: string;
}

export const CONTINENTS: GeoContinent[] = [
  { id: 'afrique', name: 'Afrique', icon: '🌍', color: '#FF7A00' },
  { id: 'europe', name: 'Europe', icon: '🇪🇺', color: '#6366F1' },
  { id: 'asie', name: 'Asie', icon: '🌏', color: '#8B5CF6' },
  { id: 'am-nord', name: 'Amérique du Nord', icon: '🌎', color: '#22C55E' },
  { id: 'am-sud', name: 'Amérique du Sud', icon: '🌎', color: '#A855F7' },
  { id: 'oceanie', name: 'Océanie', icon: '🏝️', color: '#F59E0B' },
];

export const COUNTRIES: GeoCountry[] = [
  { id: 'tn', continentId: 'afrique', name: 'Tunisie', flag: '🇹🇳', flagCode: 'tn', color: '#FF7A00', leagues: ['Ligue 1 TUN'], leagueId: 'l1-tun' },
  { id: 'dz', continentId: 'afrique', name: 'Algérie', flag: '🇩🇿', flagCode: 'dz', color: '#22C55E', leagues: ['Ligue 1 DZ'], leagueId: 'l1-dz' },
  { id: 'ma', continentId: 'afrique', name: 'Maroc', flag: '🇲🇦', flagCode: 'ma', color: '#EF4444', leagues: ['Botola Pro'], leagueId: 'botola' },
  { id: 'ci', continentId: 'afrique', name: "Côte d'Ivoire", flag: '🇨🇮', flagCode: 'ci', color: '#F59E0B', leagues: ['Ligue 1 CI'], leagueId: 'l1-ci' },
  { id: 'sn', continentId: 'afrique', name: 'Sénégal', flag: '🇸🇳', flagCode: 'sn', color: '#6366F1', leagues: ['Elite 1 SN'], leagueId: 'elite-sn' },
  { id: 'ng', continentId: 'afrique', name: 'Nigeria', flag: '🇳🇬', flagCode: 'ng', color: '#22C55E', leagues: ['NPFL'], leagueId: 'npfl' },
  { id: 'eg', continentId: 'afrique', name: 'Égypte', flag: '🇪🇬', flagCode: 'eg', color: '#8B5CF6', leagues: ['Premier League EG'], leagueId: 'pl-eg' },
  { id: 'gb', continentId: 'europe', name: 'Angleterre', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', flagCode: 'gb', color: '#7C3AED', leagues: ['Premier League'], leagueId: 'pl-eng' },
  { id: 'de', continentId: 'europe', name: 'Allemagne', flag: '🇩🇪', flagCode: 'de', color: '#DC2626', leagues: ['Bundesliga'], leagueId: 'bundesliga' },
  { id: 'it', continentId: 'europe', name: 'Italie', flag: '🇮🇹', flagCode: 'it', color: '#0284C7', leagues: ['Serie A'], leagueId: 'serie-a-it' },
  { id: 'fr', continentId: 'europe', name: 'France', flag: '🇫🇷', flagCode: 'fr', color: '#6366F1', leagues: ['Ligue 1'], leagueId: 'l1-fr' },
  { id: 'es', continentId: 'europe', name: 'Espagne', flag: '🇪🇸', flagCode: 'es', color: '#EF4444', leagues: ['La Liga'], leagueId: 'laliga' },
  { id: 'pt', continentId: 'europe', name: 'Portugal', flag: '🇵🇹', flagCode: 'pt', color: '#22C55E', leagues: ['Liga Portugal'], leagueId: 'liga-pt' },
  { id: 'nl', continentId: 'europe', name: 'Pays-Bas', flag: '🇳🇱', flagCode: 'nl', color: '#F97316', leagues: ['Eredivisie'], leagueId: 'eredivisie' },
  { id: 'be', continentId: 'europe', name: 'Belgique', flag: '🇧🇪', flagCode: 'be', color: '#EAB308', leagues: ['Pro League'], leagueId: 'pro-league-be' },
  { id: 'tr', continentId: 'europe', name: 'Turquie', flag: '🇹🇷', flagCode: 'tr', color: '#DC2626', leagues: ['Süper Lig'], leagueId: 'super-lig' },
  { id: 'br', continentId: 'am-sud', name: 'Brésil', flag: '🇧🇷', flagCode: 'br', color: '#22C55E', leagues: ['Série A'], leagueId: 'serie-a-br' },
  { id: 'ar', continentId: 'am-sud', name: 'Argentine', flag: '🇦🇷', flagCode: 'ar', color: '#6366F1', leagues: ['Primera'], leagueId: 'primera' },
  { id: 'sa', continentId: 'asie', name: 'Arabie Saoudite', flag: '🇸🇦', flagCode: 'sa', color: '#22C55E', leagues: ['Saudi Pro League'], leagueId: 'spl' },
  { id: 'ae', continentId: 'asie', name: 'Émirats', flag: '🇦🇪', flagCode: 'ae', color: '#EF4444', leagues: ['UAE Pro League'], leagueId: 'uae-pl' },
  { id: 'jp', continentId: 'asie', name: 'Japon', flag: '🇯🇵', flagCode: 'jp', color: '#DC2626', leagues: ['J-League'], leagueId: 'j-league' },
  { id: 'kr', continentId: 'asie', name: 'Corée du Sud', flag: '🇰🇷', flagCode: 'kr', color: '#6366F1', leagues: ['K League'], leagueId: 'k-league' },
  { id: 'us', continentId: 'am-nord', name: 'États-Unis', flag: '🇺🇸', flagCode: 'us', color: '#3B82F6', leagues: ['MLS'], leagueId: 'mls' },
  { id: 'mx', continentId: 'am-nord', name: 'Mexique', flag: '🇲🇽', flagCode: 'mx', color: '#22C55E', leagues: ['Liga MX'], leagueId: 'liga-mx' },
  { id: 'ca', continentId: 'am-nord', name: 'Canada', flag: '🇨🇦', flagCode: 'ca', color: '#EF4444', leagues: ['MLS'], leagueId: 'mls-ca' },
  { id: 'au', continentId: 'oceanie', name: 'Australie', flag: '🇦🇺', flagCode: 'au', color: '#F59E0B', leagues: ['A-League'], leagueId: 'a-league' },
  { id: 'nz', continentId: 'oceanie', name: 'Nouvelle-Zélande', flag: '🇳🇿', flagCode: 'nz', color: '#6366F1', leagues: ['NZ Premiership'], leagueId: 'nz-prem' },
];

export const TEAMS: GeoTeam[] = [
  { id: 'est', countryId: 'tn', name: 'ES Sahel', league: 'Ligue 1 TUN', leagueId: 'l1-tun', city: 'Sousse', tier: 'Pro', avgPotential: 82, scoutActivity: 'Haute', logoColor: 'DC2626' },
  { id: 'ca', countryId: 'tn', name: 'Club Africain', league: 'Ligue 1 TUN', leagueId: 'l1-tun', city: 'Tunis', tier: 'Pro', avgPotential: 80, scoutActivity: 'Haute', logoColor: 'DC2626' },
  { id: 'css', countryId: 'tn', name: 'CS Sfaxien', league: 'Ligue 1 TUN', leagueId: 'l1-tun', city: 'Sfax', tier: 'Pro', avgPotential: 79, scoutActivity: 'Moyenne', logoColor: '1D4ED8' },
  { id: 'st', countryId: 'tn', name: 'Stade Tunisien', league: 'Ligue 1 TUN', leagueId: 'l1-tun', city: 'Tunis', tier: 'Pro', avgPotential: 84, scoutActivity: 'Haute', logoColor: '2563EB' },
  { id: 'ari', countryId: 'tn', name: 'AS Ariana', league: 'Ligue 2 TUN', leagueId: 'l2-tun', city: 'Ariana', tier: 'D2', avgPotential: 86, scoutActivity: 'Haute', logoColor: 'FF7A00' },
  { id: 'mon', countryId: 'tn', name: 'US Monastir', league: 'Ligue 1 TUN', leagueId: 'l1-tun', city: 'Monastir', tier: 'Pro', avgPotential: 78, scoutActivity: 'Moyenne', logoColor: '059669' },
  { id: 'kab', countryId: 'dz', name: 'JS Kabylie', league: 'Ligue 1 DZ', leagueId: 'l1-dz', city: 'Tizi Ouzou', tier: 'Pro', avgPotential: 76, scoutActivity: 'Moyenne', logoColor: 'FFD700' },
  { id: 'mc', countryId: 'dz', name: 'MC Alger', league: 'Ligue 1 DZ', leagueId: 'l1-dz', city: 'Alger', tier: 'Pro', avgPotential: 77, scoutActivity: 'Faible', logoColor: '059669' },
  { id: 'wyd', countryId: 'ma', name: 'Wydad AC', league: 'Botola Pro', leagueId: 'botola', city: 'Casablanca', tier: 'Pro', avgPotential: 81, scoutActivity: 'Moyenne', logoColor: 'DC2626' },
  { id: 'raj', countryId: 'ma', name: 'Raja CA', league: 'Botola Pro', leagueId: 'botola', city: 'Rabat', tier: 'Pro', avgPotential: 80, scoutActivity: 'Moyenne', logoColor: '059669' },
  { id: 'asec', countryId: 'ci', name: 'ASEC Mimosas', league: 'Ligue 1 CI', leagueId: 'l1-ci', city: 'Abidjan', tier: 'Pro', avgPotential: 79, scoutActivity: 'Haute', logoColor: 'FFD700' },
  { id: 'afad', countryId: 'ci', name: 'AFAD Djékanou', league: 'Ligue 1 CI', leagueId: 'l1-ci', city: 'Djékanou', tier: 'Pro', avgPotential: 81, scoutActivity: 'Haute', logoColor: 'FF7A00' },
  { id: 'gen', countryId: 'sn', name: 'Génération Foot', league: 'Elite 1 SN', leagueId: 'elite-sn', city: 'Thiès', tier: 'Elite', avgPotential: 86, scoutActivity: 'Haute', logoColor: 'DC2626' },
  { id: 'jaraaf', countryId: 'sn', name: 'Jaraaf', league: 'Elite 1 SN', leagueId: 'elite-sn', city: 'Dakar', tier: 'Pro', avgPotential: 78, scoutActivity: 'Moyenne', logoColor: '2563EB' },
  { id: 'ahly', countryId: 'eg', name: 'Al Ahly', league: 'Premier League EG', leagueId: 'pl-eg', city: 'Le Caire', tier: 'Pro', avgPotential: 83, scoutActivity: 'Moyenne', logoColor: 'DC2626' },
  { id: 'zamalek', countryId: 'eg', name: 'Zamalek', league: 'Premier League EG', leagueId: 'pl-eg', city: 'Le Caire', tier: 'Pro', avgPotential: 80, scoutActivity: 'Moyenne', logoColor: 'FFFFFF' },
  { id: 'pyramids', countryId: 'eg', name: 'Pyramids FC', league: 'Premier League EG', leagueId: 'pl-eg', city: 'Le Caire', tier: 'Pro', avgPotential: 78, scoutActivity: 'Faible', logoColor: '1D4ED8' },
  { id: 'enyimba', countryId: 'ng', name: 'Enyimba', league: 'NPFL', leagueId: 'npfl', city: 'Aba', tier: 'Pro', avgPotential: 75, scoutActivity: 'Faible', logoColor: 'FFD700' },
  { id: 'rivers', countryId: 'ng', name: 'Rivers United', league: 'NPFL', leagueId: 'npfl', city: 'Port Harcourt', tier: 'Pro', avgPotential: 73, scoutActivity: 'Faible', logoColor: '2563EB' },
  { id: 'psg', countryId: 'fr', name: 'Paris SG', league: 'Ligue 1', leagueId: 'l1-fr', city: 'Paris', tier: 'Pro', avgPotential: 88, scoutActivity: 'Faible', logoColor: '004170' },
  { id: 'ol', countryId: 'fr', name: 'Olympique Lyon', league: 'Ligue 1', leagueId: 'l1-fr', city: 'Lyon', tier: 'Pro', avgPotential: 85, scoutActivity: 'Faible', logoColor: '0055A4' },
  { id: 'om', countryId: 'fr', name: 'Olympique Marseille', league: 'Ligue 1', leagueId: 'l1-fr', city: 'Marseille', tier: 'Pro', avgPotential: 84, scoutActivity: 'Moyenne', logoColor: '00A1E4' },
  { id: 'rm', countryId: 'es', name: 'Real Madrid', league: 'La Liga', leagueId: 'laliga', city: 'Madrid', tier: 'Pro', avgPotential: 90, scoutActivity: 'Faible', logoColor: 'FEBE10' },
  { id: 'barca', countryId: 'es', name: 'FC Barcelona', league: 'La Liga', leagueId: 'laliga', city: 'Barcelone', tier: 'Pro', avgPotential: 89, scoutActivity: 'Faible', logoColor: 'A50044' },
  { id: 'atm', countryId: 'es', name: 'Atlético Madrid', league: 'La Liga', leagueId: 'laliga', city: 'Madrid', tier: 'Pro', avgPotential: 86, scoutActivity: 'Faible', logoColor: 'CB3524' },
  { id: 'benfica', countryId: 'pt', name: 'Benfica', league: 'Liga Portugal', leagueId: 'liga-pt', city: 'Lisbonne', tier: 'Pro', avgPotential: 85, scoutActivity: 'Moyenne', logoColor: 'DC2626' },
  { id: 'porto', countryId: 'pt', name: 'FC Porto', league: 'Liga Portugal', leagueId: 'liga-pt', city: 'Porto', tier: 'Pro', avgPotential: 84, scoutActivity: 'Moyenne', logoColor: '00428C' },
  { id: 'city', countryId: 'gb', name: 'Manchester City', league: 'Premier League', leagueId: 'pl-eng', city: 'Manchester', tier: 'Pro', avgPotential: 89, scoutActivity: 'Faible', logoColor: '6CABDD' },
  { id: 'arsenal', countryId: 'gb', name: 'Arsenal', league: 'Premier League', leagueId: 'pl-eng', city: 'Londres', tier: 'Pro', avgPotential: 87, scoutActivity: 'Faible', logoColor: 'EF0107' },
  { id: 'liverpool', countryId: 'gb', name: 'Liverpool', league: 'Premier League', leagueId: 'pl-eng', city: 'Liverpool', tier: 'Pro', avgPotential: 88, scoutActivity: 'Faible', logoColor: 'C8102E' },
  { id: 'manu', countryId: 'gb', name: 'Man United', league: 'Premier League', leagueId: 'pl-eng', city: 'Manchester', tier: 'Pro', avgPotential: 85, scoutActivity: 'Faible', logoColor: 'DA020E' },
  { id: 'chelsea', countryId: 'gb', name: 'Chelsea', league: 'Premier League', leagueId: 'pl-eng', city: 'Londres', tier: 'Pro', avgPotential: 86, scoutActivity: 'Faible', logoColor: '034694' },
  { id: 'bayern', countryId: 'de', name: 'Bayern Munich', league: 'Bundesliga', leagueId: 'bundesliga', city: 'Munich', tier: 'Pro', avgPotential: 90, scoutActivity: 'Faible', logoColor: 'DC052D' },
  { id: 'dortmund', countryId: 'de', name: 'Borussia Dortmund', league: 'Bundesliga', leagueId: 'bundesliga', city: 'Dortmund', tier: 'Pro', avgPotential: 87, scoutActivity: 'Faible', logoColor: 'FDE100' },
  { id: 'leverkusen', countryId: 'de', name: 'Bayer Leverkusen', league: 'Bundesliga', leagueId: 'bundesliga', city: 'Leverkusen', tier: 'Pro', avgPotential: 86, scoutActivity: 'Moyenne', logoColor: 'E32221' },
  { id: 'inter', countryId: 'it', name: 'Inter Milan', league: 'Serie A', leagueId: 'serie-a-it', city: 'Milan', tier: 'Pro', avgPotential: 88, scoutActivity: 'Faible', logoColor: '010E80' },
  { id: 'milan', countryId: 'it', name: 'AC Milan', league: 'Serie A', leagueId: 'serie-a-it', city: 'Milan', tier: 'Pro', avgPotential: 87, scoutActivity: 'Faible', logoColor: 'FB090B' },
  { id: 'juve', countryId: 'it', name: 'Juventus', league: 'Serie A', leagueId: 'serie-a-it', city: 'Turin', tier: 'Pro', avgPotential: 86, scoutActivity: 'Faible', logoColor: 'FFFFFF' },
  { id: 'napoli', countryId: 'it', name: 'Napoli', league: 'Serie A', leagueId: 'serie-a-it', city: 'Naples', tier: 'Pro', avgPotential: 85, scoutActivity: 'Moyenne', logoColor: '12A0D7' },
  { id: 'ajax', countryId: 'nl', name: 'Ajax Amsterdam', league: 'Eredivisie', leagueId: 'eredivisie', city: 'Amsterdam', tier: 'Pro', avgPotential: 84, scoutActivity: 'Moyenne', logoColor: 'D2122E' },
  { id: 'psv', countryId: 'nl', name: 'PSV Eindhoven', league: 'Eredivisie', leagueId: 'eredivisie', city: 'Eindhoven', tier: 'Pro', avgPotential: 83, scoutActivity: 'Moyenne', logoColor: 'ED1C24' },
  { id: 'feyenoord', countryId: 'nl', name: 'Feyenoord', league: 'Eredivisie', leagueId: 'eredivisie', city: 'Rotterdam', tier: 'Pro', avgPotential: 82, scoutActivity: 'Moyenne', logoColor: 'E30613' },
  { id: 'brugge', countryId: 'be', name: 'Club Brugge', league: 'Pro League', leagueId: 'pro-league-be', city: 'Bruges', tier: 'Pro', avgPotential: 80, scoutActivity: 'Moyenne', logoColor: '007BC1' },
  { id: 'anderlecht', countryId: 'be', name: 'Anderlecht', league: 'Pro League', leagueId: 'pro-league-be', city: 'Bruxelles', tier: 'Pro', avgPotential: 79, scoutActivity: 'Faible', logoColor: '4B0082' },
  { id: 'galatasaray', countryId: 'tr', name: 'Galatasaray', league: 'Süper Lig', leagueId: 'super-lig', city: 'Istanbul', tier: 'Pro', avgPotential: 82, scoutActivity: 'Moyenne', logoColor: 'FFD700' },
  { id: 'fenerbahce', countryId: 'tr', name: 'Fenerbahçe', league: 'Süper Lig', leagueId: 'super-lig', city: 'Istanbul', tier: 'Pro', avgPotential: 81, scoutActivity: 'Moyenne', logoColor: 'FFED00' },
  { id: 'flamengo', countryId: 'br', name: 'Flamengo', league: 'Série A', leagueId: 'serie-a-br', city: 'Rio', tier: 'Pro', avgPotential: 87, scoutActivity: 'Moyenne', logoColor: 'DC2626' },
  { id: 'palmeiras', countryId: 'br', name: 'Palmeiras', league: 'Série A', leagueId: 'serie-a-br', city: 'São Paulo', tier: 'Pro', avgPotential: 86, scoutActivity: 'Moyenne', logoColor: '059669' },
  { id: 'boca', countryId: 'ar', name: 'Boca Juniors', league: 'Primera', leagueId: 'primera', city: 'Buenos Aires', tier: 'Pro', avgPotential: 85, scoutActivity: 'Moyenne', logoColor: '004170' },
  { id: 'river', countryId: 'ar', name: 'River Plate', league: 'Primera', leagueId: 'primera', city: 'Buenos Aires', tier: 'Pro', avgPotential: 86, scoutActivity: 'Moyenne', logoColor: 'DC2626' },
  { id: 'hilal', countryId: 'sa', name: 'Al-Hilal', league: 'Saudi Pro League', leagueId: 'spl', city: 'Riyad', tier: 'Pro', avgPotential: 84, scoutActivity: 'Moyenne', logoColor: '004A99' },
  { id: 'nassr', countryId: 'sa', name: 'Al-Nassr', league: 'Saudi Pro League', leagueId: 'spl', city: 'Riyad', tier: 'Pro', avgPotential: 83, scoutActivity: 'Moyenne', logoColor: 'FFD700' },
  { id: 'ittihad', countryId: 'sa', name: 'Al-Ittihad', league: 'Saudi Pro League', leagueId: 'spl', city: 'Jeddah', tier: 'Pro', avgPotential: 82, scoutActivity: 'Moyenne', logoColor: 'FFD700' },
  { id: 'ain', countryId: 'ae', name: 'Al-Ain', league: 'UAE Pro League', leagueId: 'uae-pl', city: 'Al Ain', tier: 'Pro', avgPotential: 78, scoutActivity: 'Faible', logoColor: '8B5CF6' },
  { id: 'vissel', countryId: 'jp', name: 'Vissel Kobe', league: 'J-League', leagueId: 'j-league', city: 'Kobe', tier: 'Pro', avgPotential: 80, scoutActivity: 'Moyenne', logoColor: 'DC2626' },
  { id: 'marinos', countryId: 'jp', name: 'Yokohama F. Marinos', league: 'J-League', leagueId: 'j-league', city: 'Yokohama', tier: 'Pro', avgPotential: 79, scoutActivity: 'Moyenne', logoColor: '004A99' },
  { id: 'ulsan', countryId: 'kr', name: 'Ulsan HD', league: 'K League', leagueId: 'k-league', city: 'Ulsan', tier: 'Pro', avgPotential: 78, scoutActivity: 'Moyenne', logoColor: '004A99' },
  { id: 'jeonbuk', countryId: 'kr', name: 'Jeonbuk Motors', league: 'K League', leagueId: 'k-league', city: 'Jeonju', tier: 'Pro', avgPotential: 79, scoutActivity: 'Moyenne', logoColor: '059669' },
  { id: 'inter-miami', countryId: 'us', name: 'Inter Miami', league: 'MLS', leagueId: 'mls', city: 'Miami', tier: 'Pro', avgPotential: 85, scoutActivity: 'Moyenne', logoColor: 'FF69B4' },
  { id: 'lafc', countryId: 'us', name: 'LAFC', league: 'MLS', leagueId: 'mls', city: 'Los Angeles', tier: 'Pro', avgPotential: 82, scoutActivity: 'Moyenne', logoColor: 'FFD700' },
  { id: 'america', countryId: 'mx', name: 'Club América', league: 'Liga MX', leagueId: 'liga-mx', city: 'Mexico', tier: 'Pro', avgPotential: 81, scoutActivity: 'Moyenne', logoColor: 'FFD700' },
  { id: 'chivas', countryId: 'mx', name: 'Chivas Guadalajara', league: 'Liga MX', leagueId: 'liga-mx', city: 'Guadalajara', tier: 'Pro', avgPotential: 80, scoutActivity: 'Moyenne', logoColor: 'DC2626' },
  { id: 'toronto', countryId: 'ca', name: 'Toronto FC', league: 'MLS', leagueId: 'mls-ca', city: 'Toronto', tier: 'Pro', avgPotential: 76, scoutActivity: 'Faible', logoColor: 'DC2626' },
  { id: 'sydney', countryId: 'au', name: 'Sydney FC', league: 'A-League', leagueId: 'a-league', city: 'Sydney', tier: 'Pro', avgPotential: 77, scoutActivity: 'Faible', logoColor: '004A99' },
  { id: 'melbourne', countryId: 'au', name: 'Melbourne City', league: 'A-League', leagueId: 'a-league', city: 'Melbourne', tier: 'Pro', avgPotential: 76, scoutActivity: 'Faible', logoColor: '6CABDD' },
  { id: 'auckland', countryId: 'nz', name: 'Auckland FC', league: 'NZ Premiership', leagueId: 'nz-prem', city: 'Auckland', tier: 'Pro', avgPotential: 72, scoutActivity: 'Faible', logoColor: '004A99' },
];

export const NATIONALITY_TO_COUNTRY: Record<string, string> = {
  Tunisie: 'tn',
  Tunisienne: 'tn',
  Algérie: 'dz',
  Algerienne: 'dz',
  Maroc: 'ma',
  Marocaine: 'ma',
  "Côte d'Ivoire": 'ci',
  'Cote d Ivoire': 'ci',
  Sénégal: 'sn',
  Senegal: 'sn',
  Nigeria: 'ng',
  Égypte: 'eg',
  Egypte: 'eg',
  France: 'fr',
  Espagne: 'es',
  Portugal: 'pt',
  Angleterre: 'gb',
  Allemagne: 'de',
  Italie: 'it',
  Brésil: 'br',
  Bresil: 'br',
  Argentine: 'ar',
  'Arabie Saoudite': 'sa',
  Japon: 'jp',
  'Corée du Sud': 'kr',
  'États-Unis': 'us',
  Mexique: 'mx',
  Australie: 'au',
};

export function getCountriesByContinent(continentId: string) {
  return COUNTRIES.filter((c) => c.continentId === continentId);
}

export function getTeamsByCountry(countryId: string) {
  return TEAMS.filter((t) => t.countryId === countryId);
}

export function getContinent(id: string) {
  return CONTINENTS.find((c) => c.id === id);
}

export function getCountry(id: string) {
  return COUNTRIES.find((c) => c.id === id);
}

export function getTeam(id: string) {
  return TEAMS.find((t) => t.id === id);
}

export function matchClubName(prospectClub: string, teamName: string) {
  const a = prospectClub.toLowerCase().trim();
  const b = teamName.toLowerCase().trim();
  if (!a || !b) return false;
  if (a.includes(b) || b.includes(a)) return true;
  const lastWord = b.split(' ').pop() ?? '';
  return lastWord.length > 3 && a.includes(lastWord);
}
