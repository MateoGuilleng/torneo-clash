'use client';

import { useEffect, useState } from 'react';
import { handleAPIError, validatePlayerTag, formatPlayerTagFrontend, getRandomLoadingMessage } from '../lib/api-utils.js';

/* ------------------- Helpers (lógica del torneo) ------------------- */
function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

function isPowerOfTwo(n) {
  return n >= 2 && (n & (n - 1)) === 0;
}

function createInitialMatches(players) {
  const shuffled = shuffle(players);
  const matches = [];
  for (let i = 0; i < shuffled.length; i += 2) {
    matches.push({
      id: `w0-${i / 2}`,
      player1: shuffled[i],
      player2: shuffled[i + 1] || null,
      winner: null,
      completed: false,
      round: 1,
    });
  }
  return [matches];
}

function advanceBracket(bracket) {
  const prevRound = bracket[bracket.length - 1];
  const nextRound = [];
  for (let i = 0; i < prevRound.length; i += 2) {
    const p1 = prevRound[i]?.winner;
    const p2 = prevRound[i + 1]?.winner;
    if (p1 && p2) {
      nextRound.push({
        id: `w${bracket.length}-${i / 2}`,
        player1: p1,
        player2: p2,
        winner: null,
        completed: false,
        round: bracket.length + 1,
      });
    }
  }
  if (nextRound.length > 0) bracket.push(nextRound);
  return bracket;
}

function addToLosersBracket(losersBracket, losers, fromWinnersRound) {
  while (losersBracket.length <= fromWinnersRound - 1) {
    losersBracket.push([]);
  }
  const round = losersBracket[fromWinnersRound - 1];

  let previousWinners = [];
  if (fromWinnersRound > 1 && losersBracket[fromWinnersRound - 2]) {
    previousWinners = losersBracket[fromWinnersRound - 2]
      .filter(m => m.completed && m.winner)
      .map(m => m.winner);
  }

  const newMatches = [];
  if (previousWinners.length === 0) {
    for (let i = 0; i < losers.length; i += 2) {
      newMatches.push({
        id: `l${fromWinnersRound}-${round.length + i}`,
        player1: losers[i],
        player2: losers[i + 1] || null,
        winner: null,
        completed: false,
        round: fromWinnersRound,
      });
    }
  } else {
    for (let i = 0; i < losers.length; i++) {
      newMatches.push({
        id: `l${fromWinnersRound}-${round.length + i}`,
        player1: previousWinners[i],
        player2: losers[i],
        winner: null,
        completed: false,
        round: fromWinnersRound,
      });
    }
  }
  losersBracket[fromWinnersRound - 1] = [...round, ...newMatches];
  return losersBracket;
}

function getLosersChampion(losersBracket) {
  const lastRound = losersBracket[losersBracket.length - 1];
  if (lastRound && lastRound.length === 1 && lastRound[0].completed) {
    return lastRound[0].winner;
  }
  return null;
}

/* ------------------- UI Component ------------------- */

export default function Page() {
  const [players, setPlayers] = useState([]);
  const [playerName, setPlayerName] = useState('');
  const [playerTag, setPlayerTag] = useState('');
  const [tournamentStarted, setTournamentStarted] = useState(false);
  const [winnersBracket, setWinnersBracket] = useState([]);
  const [losersBracket, setLosersBracket] = useState([]);
  const [grandFinal, setGrandFinal] = useState(null);
  const [tournamentComplete, setTournamentComplete] = useState(false);
  const [winner, setWinner] = useState(null);
  const [playerDetails, setPlayerDetails] = useState({});
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [loadingPlayers, setLoadingPlayers] = useState({});

  /* ---------- Player management ---------- */
  const addPlayer = () => {
    const name = playerName.trim();
    const tag = playerTag.trim();
    
    if (!name) return;
    
    // Validar Player Tag si se proporciona
    if (tag) {
      const validation = validatePlayerTag(tag);
      if (!validation.valid) {
        alert(`Error: ${validation.message}`);
        return;
      }
    }
    
    const formattedTag = tag ? formatPlayerTagFrontend(tag) : null;
    
    setPlayers(prev => [...prev, { 
      id: Date.now().toString(), 
      name, 
      playerTag: formattedTag,
      setsWon: 0,
      setsLost: 0,
      gamesWon: 0,
      gamesLost: 0
    }]);
    setPlayerName('');
    setPlayerTag('');
  };

  /* ---------- Clash Royale API ---------- */
  const fetchPlayerData = async (playerTag) => {
    if (!playerTag) return null;
    
    setLoadingPlayers(prev => ({ ...prev, [playerTag]: true }));
    // https://api.clashroyale.com/v1/players/%23G9YV9GR8R
    try {
      const response = await fetch(`/api/player/${encodeURIComponent(playerTag)}`);
      if (!response.ok) throw new Error('Player not found');
      
      const data = await response.json();
      setPlayerDetails(prev => ({ ...prev, [playerTag]: data }));
      return data;
    } catch (error) {
      console.error('Error fetching player data:', error);
      return null;
    } finally {
      setLoadingPlayers(prev => ({ ...prev, [playerTag]: false }));
    }
  };

  const handlePlayerClick = async (player) => {
    if (!player.playerTag) {
      const tag = prompt(`Ingresa el Player Tag de ${player.name} (ej: #G9YV9GR8R):`);
      if (tag) {
        const validation = validatePlayerTag(tag);
        if (!validation.valid) {
          alert(`Error: ${validation.message}`);
          return;
        }
        
        const formattedTag = formatPlayerTagFrontend(tag);
        const playerWithTag = { ...player, playerTag: formattedTag };
        setPlayers(prev => prev.map(p => p.id === player.id ? playerWithTag : p));
        
        try {
          await fetchPlayerData(formattedTag);
          setSelectedPlayer(playerWithTag);
          setShowPlayerModal(true);
        } catch (error) {
          console.error('Error loading player data:', error);
          alert('Error al cargar los datos del jugador. Verifica el Player Tag.');
        }
      }
      return;
    }

    if (!playerDetails[player.playerTag]) {
      try {
        await fetchPlayerData(player.playerTag);
      } catch (error) {
        console.error('Error loading player data:', error);
        alert('Error al cargar los datos del jugador.');
        return;
      }
    }
    
    setSelectedPlayer(player);
    setShowPlayerModal(true);
  };

  const removePlayer = (id) => {
    setPlayers(prev => prev.filter(p => p.id !== id));
  };

  /* ---------- Start / Reset tournament ---------- */
  const handleStartTournament = () => {
    if (!isPowerOfTwo(players.length)) {
      alert('El número de jugadores debe ser potencia de 2 (2, 4, 8, 16, ...).');
      return;
    }
    setTournamentStarted(true);
    setWinnersBracket(createInitialMatches(players));
    setLosersBracket([]);
    setGrandFinal(null);
    setTournamentComplete(false);
    setWinner(null);
  };

  const handleResetTournament = () => {
    setPlayers([]);
    setPlayerName('');
    setPlayerTag('');
    setTournamentStarted(false);
    setWinnersBracket([]);
    setLosersBracket([]);
    setGrandFinal(null);
    setTournamentComplete(false);
    setWinner(null);
  };

  /* ---------- Select winner in any bracket ---------- */
  const handleSelectWinner = (bracketType, roundIndex, matchIndex, winnerId) => {
    const isGrandFinal = bracketType === 'grandFinal';
    const maxSets = isGrandFinal ? 5 : 3;
    const setsToWin = Math.ceil(maxSets / 2);

    if (bracketType === 'winners') {
      const updatedBracket = JSON.parse(JSON.stringify(winnersBracket));
      const match = updatedBracket[roundIndex][matchIndex];
      
      // Incrementar sets del ganador
      if (match.player1.id === winnerId) {
        match.player1Sets = (match.player1Sets || 0) + 1;
      } else {
        match.player2Sets = (match.player2Sets || 0) + 1;
      }
      
      // Verificar si alguien ganó el match
      const player1Sets = match.player1Sets || 0;
      const player2Sets = match.player2Sets || 0;
      
      if (player1Sets >= setsToWin || player2Sets >= setsToWin) {
        match.winner = match.player1.id === winnerId ? match.player1 : match.player2;
        match.winnerSets = match.player1.id === winnerId ? player1Sets : player2Sets;
        match.loserSets = match.player1.id === winnerId ? player2Sets : player1Sets;
        match.completed = true;
        
        setWinnersBracket(updatedBracket);

        // When winners round completes, send losers to losers bracket and advance winners bracket
        if (updatedBracket[roundIndex].every(m => m.completed)) {
          const losers = updatedBracket[roundIndex]
            .map(m => (m.player1.id === m.winner.id ? m.player2 : m.player1))
            .filter(l => l);
          if (losers.length > 0) {
            const updatedLosers = addToLosersBracket(JSON.parse(JSON.stringify(losersBracket)), losers, roundIndex + 1);
            setLosersBracket(updatedLosers);
          }
          const advanced = advanceBracket(updatedBracket);
          setWinnersBracket([...advanced]);
        }
      } else {
        setWinnersBracket(updatedBracket);
      }
    } else if (bracketType === 'losers') {
      const updated = JSON.parse(JSON.stringify(losersBracket));
      const match = updated[roundIndex][matchIndex];
      
      // Incrementar sets del ganador
      if (match.player1.id === winnerId) {
        match.player1Sets = (match.player1Sets || 0) + 1;
      } else {
        match.player2Sets = (match.player2Sets || 0) + 1;
      }
      
      // Verificar si alguien ganó el match
      const player1Sets = match.player1Sets || 0;
      const player2Sets = match.player2Sets || 0;
      
      if (player1Sets >= setsToWin || player2Sets >= setsToWin) {
        match.winner = match.player1.id === winnerId ? match.player1 : match.player2;
        match.winnerSets = match.player1.id === winnerId ? player1Sets : player2Sets;
        match.loserSets = match.player1.id === winnerId ? player2Sets : player1Sets;
        match.completed = true;
        
        setLosersBracket(updated);
      } else {
        setLosersBracket(updated);
      }
    } else if (bracketType === 'grandFinal') {
      const gf = { ...grandFinal };
      
      // Incrementar sets del ganador
      if (gf.player1.id === winnerId) {
        gf.player1Sets = (gf.player1Sets || 0) + 1;
      } else {
        gf.player2Sets = (gf.player2Sets || 0) + 1;
      }
      
      // Verificar si alguien ganó el match
      const player1Sets = gf.player1Sets || 0;
      const player2Sets = gf.player2Sets || 0;
      
      if (player1Sets >= setsToWin || player2Sets >= setsToWin) {
        gf.winner = players.find(p => p.id === winnerId) || null;
        gf.winnerSets = gf.player1.id === winnerId ? player1Sets : player2Sets;
        gf.loserSets = gf.player1.id === winnerId ? player2Sets : player1Sets;
        gf.completed = true;
        
        if (gf.winner && gf.winner.id === gf.player2.id) {
          // Reset needed - player from losers bracket won
          gf.reset = true;
          gf.player1Sets = 0;
          gf.player2Sets = 0;
          gf.completed = false;
          gf.winner = null;
          gf.winnerSets = null;
          gf.loserSets = null;
        } else {
          // Tournament complete
          setTournamentComplete(true);
          setWinner(gf.winner);
        }
      }
      
      setGrandFinal(gf);
    }
  };

  /* ---------- Create Grand Final when ready (useEffect) ----------
     CORRECCIÓN: ahora enfrenta al CAMPEÓN DE WINNERS vs CAMPEÓN DE LOSERS
  */
  useEffect(() => {
    if (
      tournamentStarted &&
      winnersBracket.length > 0 &&
      winnersBracket[winnersBracket.length - 1].length === 1 &&
      winnersBracket[winnersBracket.length - 1][0].completed &&
      getLosersChampion(losersBracket) &&
      !grandFinal
    ) {
      const finalMatch = winnersBracket[winnersBracket.length - 1][0];
      const winnersChampion = finalMatch.winner; // <-- AQUÍ: campeón de winners (antes se tomaba el perdedor)
      setGrandFinal({
        player1: winnersChampion,
        player2: getLosersChampion(losersBracket),
        winner: null,
        completed: false
      });
    }
  }, [winnersBracket, losersBracket, tournamentStarted, grandFinal]);

  /* ---------- Rendering helpers (stylish cards) ---------- */
  const PlayerInfo = ({ player, isWinner = false }) => {
    if (!player) return <span className="text-neutral-400">TBD</span>;
    
    const playerData = player.playerTag ? playerDetails[player.playerTag] : null;
    const isLoading = player.playerTag ? loadingPlayers[player.playerTag] : false;
    
  return (
      <div 
        className={`flex items-center gap-2 cursor-pointer hover:bg-neutral-700/50 rounded-lg p-2 transition-colors ${isWinner ? 'bg-emerald-900/30' : ''}`}
        onClick={() => handlePlayerClick(player)}
      >
        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
          {player.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-white text-sm">{player.name}</span>
          {playerData && (
            <div className="text-xs text-neutral-400">
              <span className="text-yellow-400">{playerData.basic.trophies}</span> 🏆 | 
              <span className="text-green-400"> {playerData.battles.wins}</span>W | 
              <span className="text-red-400"> {playerData.battles.losses}</span>L
            </div>
          )}
          {isLoading && (
            <div className="text-xs text-blue-400">Cargando...</div>
          )}
          {!playerData && player.playerTag && (
            <div className="text-xs text-neutral-500">Click para cargar datos</div>
          )}
        </div>
      </div>
    );
  };

  const MatchCard = ({ match, onWinP1, onWinP2, bracketType, roundIndex, matchIndex }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const isGrandFinal = bracketType === 'grandFinal';
    const maxSets = isGrandFinal ? 5 : 3;
    const setsToWin = Math.ceil(maxSets / 2);
    
    const player1Sets = match.player1Sets || 0;
    const player2Sets = match.player2Sets || 0;
    
    const renderSetCircles = (playerSets, playerId, isWinner) => {
      const circles = [];
      for (let i = 0; i < maxSets; i++) {
        circles.push(
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 ${
              i < playerSets 
                ? 'bg-emerald-500 border-emerald-400' 
                : 'bg-neutral-700 border-neutral-600'
            } ${isWinner ? 'ring-2 ring-yellow-400' : ''}`}
            title={`Set ${i + 1}: ${i < playerSets ? 'Ganado' : 'Perdido'}`}
          />
        );
      }
      return circles;
    };

    return (
      <div className="bg-gradient-to-r from-neutral-900/60 to-neutral-800/40 border border-neutral-700 rounded-xl shadow-lg transform hover:scale-[1.01] transition">
        <div className="p-3">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-neutral-300">Match</div>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs px-2 py-1 rounded bg-neutral-800/50 hover:bg-neutral-700/50 transition-colors"
              >
                {isExpanded ? 'Contraer' : 'Expandir'}
              </button>
            </div>
            
            {/* Player 1 */}
            <div className="flex items-center justify-between">
              <PlayerInfo player={match.player1} isWinner={match.completed && match.winner?.id === match.player1?.id} />
              <div className="flex gap-1">
                {renderSetCircles(player1Sets, match.player1?.id, match.completed && match.winner?.id === match.player1?.id)}
              </div>
            </div>
            
            <div className="text-center text-neutral-400 text-sm font-bold">VS</div>
            
            {/* Player 2 */}
            <div className="flex items-center justify-between">
              <PlayerInfo player={match.player2} isWinner={match.completed && match.winner?.id === match.player2?.id} />
              <div className="flex gap-1">
                {renderSetCircles(player2Sets, match.player2?.id, match.completed && match.winner?.id === match.player2?.id)}
              </div>
            </div>
            
            {/* Score */}
            <div className="text-center text-lg font-bold text-white">
              {player1Sets} - {player2Sets}
            </div>
            
            {/* Action buttons */}
            <div className="flex flex-col gap-2">
              {!match.completed && match.player1 && match.player2 && (
                <>
                  <button
                    onClick={onWinP1}
                    className="px-3 py-1 rounded-md text-xs font-semibold bg-gradient-to-r from-blue-600 to-blue-400 text-white ring-1 ring-blue-300/40 hover:from-blue-500 hover:to-blue-300"
                  >
                    {match.player1.name} GANÓ SET
                  </button>
                  <button
                    onClick={onWinP2}
                    className="px-3 py-1 rounded-md text-xs font-semibold bg-gradient-to-r from-red-600 to-red-400 text-white ring-1 ring-red-300/40 hover:from-red-500 hover:to-red-300"
                  >
                    {match.player2.name} GANÓ SET
                  </button>
                </>
              )}
              {match.completed && match.winner && (
                <div className="text-sm font-semibold text-emerald-300 text-center">
                  🏆 Ganador: {match.winner.name} ({match.winnerSets || setsToWin}-{match.loserSets || 0})
                </div>
              )}
            </div>
          </div>
        </div>
      
        {/* Expanded Content */}
        {isExpanded && (
          <div className="border-t border-neutral-700 p-3 bg-neutral-800/30">
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white">Información Detallada</h4>
              
              {/* Player 1 Details */}
              <div className="bg-neutral-900/50 rounded-lg p-3">
                <h5 className="text-xs font-semibold text-blue-400 mb-2">{match.player1?.name}</h5>
                {match.player1?.playerTag && playerDetails[match.player1.playerTag] ? (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-neutral-400">Trofeos:</span>
                      <span className="text-yellow-400 ml-1">{playerDetails[match.player1.playerTag].basic.trophies.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400">Win Rate:</span>
                      <span className="text-green-400 ml-1">{playerDetails[match.player1.playerTag].battles.winRate}%</span>
                    </div>
                    <div>
                      <span className="text-neutral-400">Arena:</span>
                      <span className="text-orange-400 ml-1">{playerDetails[match.player1.playerTag].arena.name}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400">Clan:</span>
                      <span className="text-red-400 ml-1">{playerDetails[match.player1.playerTag].clan?.name || 'Sin clan'}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-neutral-500">Sin datos de Clash Royale</p>
                )}
              </div>
              
              {/* Player 2 Details */}
              <div className="bg-neutral-900/50 rounded-lg p-3">
                <h5 className="text-xs font-semibold text-red-400 mb-2">{match.player2?.name}</h5>
                {match.player2?.playerTag && playerDetails[match.player2.playerTag] ? (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-neutral-400">Trofeos:</span>
                      <span className="text-yellow-400 ml-1">{playerDetails[match.player2.playerTag].basic.trophies.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400">Win Rate:</span>
                      <span className="text-green-400 ml-1">{playerDetails[match.player2.playerTag].battles.winRate}%</span>
                    </div>
                    <div>
                      <span className="text-neutral-400">Arena:</span>
                      <span className="text-orange-400 ml-1">{playerDetails[match.player2.playerTag].arena.name}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400">Clan:</span>
                      <span className="text-red-400 ml-1">{playerDetails[match.player2.playerTag].clan?.name || 'Sin clan'}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-neutral-500">Sin datos de Clash Royale</p>
                )}
              </div>
              
              {/* Match Info */}
              <div className="bg-neutral-900/50 rounded-lg p-3">
                <h5 className="text-xs font-semibold text-purple-400 mb-2">Información del Match</h5>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-neutral-400">Formato:</span>
                    <span className="text-white ml-1">Mejor de {maxSets}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400">Sets para ganar:</span>
                    <span className="text-white ml-1">{setsToWin}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400">Tipo:</span>
                    <span className="text-white ml-1">{isGrandFinal ? 'Gran Final' : 'Ronda Normal'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400">Estado:</span>
                    <span className={`ml-1 ${match.completed ? 'text-emerald-400' : 'text-yellow-400'}`}>
                      {match.completed ? 'Completado' : 'En progreso'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderBracket = (bracket, type) => (
    <div className="flex gap-6 items-start">
      {bracket.map((round, roundIdx) => (
        <div key={roundIdx} className="min-w-[220px]">
          <div className="mb-3 text-center font-extrabold text-white text-sm tracking-wider">
            {type === 'winners' ? `Winners R${roundIdx + 1}` : `Losers R${roundIdx + 1}`}
          </div>
          <div className="flex flex-col gap-3">
            {round.map((match, matchIdx) => (
              <MatchCard
                key={match.id}
                match={match}
                onWinP1={() => handleSelectWinner(type === 'winners' ? 'winners' : 'losers', roundIdx, matchIdx, match.player1?.id)}
                onWinP2={() => handleSelectWinner(type === 'winners' ? 'winners' : 'losers', roundIdx, matchIdx, match.player2?.id)}
                bracketType={type === 'winners' ? 'winners' : 'losers'}
                roundIndex={roundIdx}
                matchIndex={matchIdx}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderGrandFinal = () => (
    grandFinal && (
      <div className="mt-8 p-5 rounded-2xl backdrop-blur-sm border border-neutral-700 bg-gradient-to-r from-indigo-900/40 to-rose-900/20">
        <div className="text-center text-yellow-300 font-extrabold uppercase tracking-wider mb-4">
          {grandFinal.reset ? 'Grand Final - Reset' : 'Grand Final'}
        </div>
        
        <div className="max-w-md mx-auto">
          <MatchCard
            match={grandFinal}
            onWinP1={() => handleSelectWinner('grandFinal', null, null, grandFinal.player1.id)}
            onWinP2={() => handleSelectWinner('grandFinal', null, null, grandFinal.player2.id)}
            bracketType="grandFinal"
            roundIndex={null}
            matchIndex={null}
          />
        </div>

        {grandFinal.completed && winner && (
          <div className="mt-4 text-center text-2xl font-extrabold text-emerald-300">
            🏆 Campeón: {winner.name}
          </div>
        )}
      </div>
    )
  );

  /* ------------------- Layout ------------------- */
  return (
    <div className="min-h-screen p-8 bg-gradient-to-b from-black via-slate-900 to-neutral-900 text-white">
      <header className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 flex items-center justify-center shadow-2xl ring-2 ring-yellow-500/30">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6v6l4 2" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-widest">TORNEO CLASH ROYALE</h1>
              <div className="text-sm text-neutral-300">Torneo de proyeccion social</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs text-neutral-300">Jugadores:</div>
            <div className="px-3 py-1 rounded-full bg-neutral-800/50 text-white font-semibold">{players.length}</div>
            <div className="hidden md:flex gap-2">
              <button
                onClick={handleResetTournament}
                className="px-3 py-1 rounded-md bg-neutral-800/60 hover:bg-neutral-700 text-sm"
              >
                Reiniciar
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        {/* REGISTER / START */}
        {!tournamentStarted && (
          <section className="mb-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <div className="md:col-span-2 p-6 rounded-2xl border border-neutral-700 bg-gradient-to-r from-slate-900/60 to-slate-800/30">
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-3">
                  <input
                    className="flex-1 px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 placeholder-neutral-500 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Nombre del jugador"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
                  />
                  <button
                    onClick={addPlayer}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-400 font-bold"
                  >
                    Agregar
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    className="flex-1 px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 placeholder-neutral-500 focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="Player Tag (opcional) - ej: #G9YV9GR8R"
                    value={playerTag}
                    onChange={(e) => setPlayerTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
                  />
                  <div className="text-xs text-neutral-400 px-2">
                    Opcional
                  </div>
                </div>
              </div>
                <button
                  onClick={handleStartTournament}
                  disabled={players.length < 2}
                  className={`px-4 py-2 rounded-lg font-bold ${isPowerOfTwo(players.length) ? 'bg-gradient-to-r from-rose-600 to-red-500' : 'bg-neutral-700/50 cursor-not-allowed'}`}
                >
                  Iniciar Torneo
                </button>

              <div className="text-sm text-neutral-300 mb-3">
                <strong>Nota:</strong> el torneo requiere <span className="font-semibold">potencia de 2</span> jugadores (2, 4, 8, 16...) para evitar byes.
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <h3 className="text-sm font-bold text-white mb-2">Jugadores Registrados</h3>
                  <ul className="space-y-2">
                    {players.map(p => (
                      <li key={p.id} className="flex items-center justify-between bg-neutral-900/30 p-3 rounded-md border border-neutral-800">
                        <div className="flex flex-col">
                          <span className="truncate font-semibold">{p.name}</span>
                          {p.playerTag && (
                            <span className="text-xs text-purple-400">{p.playerTag}</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => removePlayer(p.id)} className="text-xs px-2 py-1 rounded bg-neutral-800/50">Eliminar</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="col-span-1">
                  <h3 className="text-sm font-bold text-white mb-2">Preview del Bracket</h3>
                  <div className="p-3 rounded-lg bg-gradient-to-br from-slate-900/40 to-slate-800/10 border border-neutral-800">
                    <div className="text-xs text-neutral-400 mb-2">Cuando inicies, los brackets se generarán aleatoriamente.</div>
                    <div className="flex gap-2 flex-wrap">
                      <div className="px-3 py-1 rounded-full bg-blue-700/80 text-white text-xs font-bold">Blue Team</div>
                      <div className="px-3 py-1 rounded-full bg-red-700/80 text-white text-xs font-bold">Red Team</div>
                      <div className="px-3 py-1 rounded-full bg-yellow-600/70 text-white text-xs font-bold">Final</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <aside className="p-6 rounded-2xl border border-neutral-700 bg-gradient-to-r from-neutral-900/50 to-neutral-800/20">
              <div className="text-sm font-bold mb-2">Instrucciones</div>
              <ol className="text-sm text-neutral-300 space-y-2 list-decimal list-inside">
                <li>Agrega jugadores con nombre y Player Tag (opcional).</li>
                <li>Solo potencias de 2 permiten iniciar.</li>
                <li>Rondas normales: mejor de 3 sets.</li>
                <li>Gran Final: mejor de 5 sets.</li>
                <li>Click en "Expandir" para ver detalles de jugadores.</li>
                <li>Los círculos muestran sets ganados por jugador.</li>
              </ol>
            </aside>
          </section>
        )}

        {/* TOURNAMENT VIEW */}
        {tournamentStarted && (
          <>
            {/* Brackets top: winners (horizontal columns) */}
            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-extrabold">Bracket de Ganadores</h2>
                <div className="text-sm text-neutral-400">Formato Horizontal • Rondas →</div>
              </div>

              <div className="overflow-x-auto">
                <div className="flex gap-8 items-start">
                  {/* Winners: horizontal columns */}
                  <div className="flex gap-6 items-start">
                    {renderBracket(winnersBracket, 'winners')}
                  </div>
                </div>
              </div>
            </section>

            {/* Losers: displayed below winners (horizontal) */}
            <section className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-extrabold text-rose-300">Bracket de Perdedores</h2>
                <div className="text-sm text-neutral-400">Losers bracket (parte inferior)</div>
              </div>

              <div className="overflow-x-auto">
                <div className="flex gap-8 items-start">
                  {losersBracket.length === 0 ? (
                    <div className="text-sm text-neutral-400">Aún no hay matches en losers. Se llenará conforme terminen rondas en winners.</div>
                  ) : (
                    renderBracket(losersBracket, 'losers')
                  )}
                </div>
              </div>
            </section>

            {/* Grand Final */}
            <section>
              {renderGrandFinal()}
            </section>

            {/* Controls & Winner */}
            <section className="mt-8 flex items-center gap-4">
              {tournamentComplete && winner ? (
                <div className="text-2xl font-extrabold text-emerald-300">🏆 Campeón: {winner.name}</div>
              ) : (
                <div className="text-sm text-neutral-300">Mientras tanto, continúa seleccionando ganadores.</div>
              )}

              <div className="ml-auto flex gap-2">
                <button onClick={handleResetTournament} className="px-4 py-2 rounded-md bg-neutral-800/60">Reiniciar</button>
              </div>
            </section>
          </>
        )}
      </main>

      

      {/* Player Details Modal */}
      {showPlayerModal && selectedPlayer && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-neutral-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Detalles del Jugador</h3>
              <button
                onClick={() => setShowPlayerModal(false)}
                className="text-neutral-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            {selectedPlayer.playerTag && playerDetails[selectedPlayer.playerTag] ? (
              <div className="space-y-6">
                {/* Player Basic Info */}
                <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                      {selectedPlayer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white">{playerDetails[selectedPlayer.playerTag].basic.name}</h4>
                      <p className="text-neutral-400">{playerDetails[selectedPlayer.playerTag].basic.tag}</p>
                      <p className="text-sm text-neutral-300">Nivel {playerDetails[selectedPlayer.playerTag].basic.level}</p>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-neutral-800/50 rounded-lg p-4">
                    <h5 className="font-bold text-yellow-400 mb-2">🏆 Trofeos</h5>
                    <p className="text-2xl font-bold text-white">{playerDetails[selectedPlayer.playerTag].basic.trophies.toLocaleString()}</p>
                    <p className="text-sm text-neutral-400">Mejor: {playerDetails[selectedPlayer.playerTag].basic.bestTrophies.toLocaleString()}</p>
                  </div>
                  
                  <div className="bg-neutral-800/50 rounded-lg p-4">
                    <h5 className="font-bold text-green-400 mb-2">⚔️ Batallas</h5>
                    <p className="text-2xl font-bold text-white">{playerDetails[selectedPlayer.playerTag].battles.total.toLocaleString()}</p>
                    <p className="text-sm text-neutral-400">
                      {playerDetails[selectedPlayer.playerTag].battles.wins}W - {playerDetails[selectedPlayer.playerTag].battles.losses}L
                    </p>
                    <p className="text-xs text-blue-400">Win Rate: {playerDetails[selectedPlayer.playerTag].battles.winRate}%</p>
                  </div>

                  <div className="bg-neutral-800/50 rounded-lg p-4">
                    <h5 className="font-bold text-blue-400 mb-2">👑 Tres Coronas</h5>
                    <p className="text-2xl font-bold text-white">{playerDetails[selectedPlayer.playerTag].battles.threeCrowns.toLocaleString()}</p>
                  </div>

                  <div className="bg-neutral-800/50 rounded-lg p-4">
                    <h5 className="font-bold text-purple-400 mb-2">🎯 Desafíos</h5>
                    <p className="text-2xl font-bold text-white">{playerDetails[selectedPlayer.playerTag].challenges.maxWins}</p>
                    <p className="text-sm text-neutral-400">Máximo ganados</p>
                  </div>
                </div>

                {/* Arena & Clan */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-neutral-800/50 rounded-lg p-4">
                    <h5 className="font-bold text-orange-400 mb-2">🏟️ Arena</h5>
                    <p className="text-lg font-semibold text-white">{playerDetails[selectedPlayer.playerTag].arena.name}</p>
                  </div>
                  
                  {playerDetails[selectedPlayer.playerTag].clan && (
                    <div className="bg-neutral-800/50 rounded-lg p-4">
                      <h5 className="font-bold text-red-400 mb-2">👥 Clan</h5>
                      <p className="text-lg font-semibold text-white">{playerDetails[selectedPlayer.playerTag].clan.name}</p>
                      <p className="text-sm text-neutral-400">{playerDetails[selectedPlayer.playerTag].clan.role}</p>
                    </div>
                  )}
                </div>

                {/* League Statistics */}
                {playerDetails[selectedPlayer.playerTag].league && (
                  <div className="bg-neutral-800/50 rounded-lg p-4">
                    <h5 className="font-bold text-yellow-400 mb-3">📊 Estadísticas de Liga</h5>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-neutral-400">Temporada Actual</p>
                        <p className="font-bold text-white">{playerDetails[selectedPlayer.playerTag].league.current.trophies}</p>
                      </div>
                      <div>
                        <p className="text-neutral-400">Temporada Anterior</p>
                        <p className="font-bold text-white">{playerDetails[selectedPlayer.playerTag].league.previous.trophies}</p>
                      </div>
                      <div>
                        <p className="text-neutral-400">Mejor Temporada</p>
                        <p className="font-bold text-white">{playerDetails[selectedPlayer.playerTag].league.best.trophies}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Badges */}
                {playerDetails[selectedPlayer.playerTag].badges && playerDetails[selectedPlayer.playerTag].badges.length > 0 && (
                  <div className="bg-neutral-800/50 rounded-lg p-4">
                    <h5 className="font-bold text-purple-400 mb-3">🏅 Insignias ({playerDetails[selectedPlayer.playerTag].badges.length})</h5>
                    <div className="grid grid-cols-4 gap-2">
                      {playerDetails[selectedPlayer.playerTag].badges.slice(0, 8).map((badge, index) => (
                        <div key={index} className="bg-neutral-700/50 rounded-lg p-2 text-center">
                          <img 
                            src={badge.iconUrls.large} 
                            alt={badge.name}
                            className="w-8 h-8 mx-auto mb-1"
                          />
                          <p className="text-xs text-neutral-300 truncate">{badge.name}</p>
                          {badge.level && (
                            <p className="text-xs text-yellow-400">Nivel {badge.level}</p>
                          )}
                        </div>
                      ))}
                    </div>
                    {playerDetails[selectedPlayer.playerTag].badges.length > 8 && (
                      <p className="text-sm text-neutral-400 mt-2">Y {playerDetails[selectedPlayer.playerTag].badges.length - 8} más...</p>
                    )}
                  </div>
                )}

                {/* API Link */}
                <div className="text-center">
                  <a
                    href={`https://royaleapi.com/player/${selectedPlayer.playerTag.replace('#', '')}`}
          target="_blank"
          rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white font-semibold hover:from-blue-500 hover:to-purple-500 transition-colors"
                  >
                    🔗 Ver en RoyaleAPI
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-neutral-400 mb-4">
                  {loadingPlayers[selectedPlayer.playerTag] ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                      <span>Cargando datos del jugador...</span>
                    </div>
                  ) : (
                    <div>
                      <p className="text-lg mb-4">No se encontraron datos para este jugador</p>
                      <p className="text-sm text-neutral-500">Verifica que el Player Tag sea correcto</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
