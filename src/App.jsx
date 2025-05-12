import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const IndaiaVolleyballSystem = () => {
  // Estados para armazenar os jogos e ranking
  const [games, setGames] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [teams, setTeams] = useState([]);
  const [newTeam, setNewTeam] = useState('');

  // Estado para o jogo atual sendo adicionado/editado
  const [currentGame, setCurrentGame] = useState({
    teamA: '',
    teamB: '',
    sets: [
      { pointsA: 0, pointsB: 0 },
      { pointsA: 0, pointsB: 0 }
    ],
    needsThirdSet: false
  });

  // Estado para controlar o modo de edição
  const [editingIndex, setEditingIndex] = useState(null);

  // Cores do Clube Indaiá Dourados/MS
  const colors = {
    primary: '#006400', // Verde escuro
    secondary: '#FFD700', // Dourado
    accent: '#FFFF00', // Amarelo
    background: '#F0F8FF', // Azul claro
    text: '#004225' // Verde escuro para texto
  };

  // Efeito para verificar se precisa de um terceiro set (quando cada time ganhou 1 set)
  useEffect(() => {
    const set1Winner = currentGame.sets[0].pointsA > currentGame.sets[0].pointsB ? 'A' : 'B';
    const set2Winner = currentGame.sets[1].pointsA > currentGame.sets[1].pointsB ? 'A' : 'B';

    // Se os vencedores dos dois primeiros sets forem diferentes, precisamos de um terceiro set
    if (currentGame.sets[0].pointsA > 0 && currentGame.sets[0].pointsB > 0 &&
      currentGame.sets[1].pointsA > 0 && currentGame.sets[1].pointsB > 0 &&
      set1Winner !== set2Winner) {

      // Adiciona o terceiro set se ainda não existir
      if (currentGame.sets.length < 3) {
        setCurrentGame(prev => ({
          ...prev,
          sets: [...prev.sets, { pointsA: 0, pointsB: 0 }],
          needsThirdSet: true
        }));
      }
    } else {
      // Remove o terceiro set se existir e não for mais necessário
      if (currentGame.sets.length > 2) {
        setCurrentGame(prev => ({
          ...prev,
          sets: prev.sets.slice(0, 2),
          needsThirdSet: false
        }));
      }
    }
  }, [currentGame.sets[0], currentGame.sets[1]]);

  // Efeito para calcular o ranking sempre que os jogos são atualizados
  useEffect(() => {
    calculateRanking();
  }, [games]);

  // Função para calcular o ranking das equipes
  const calculateRanking = () => {
    const teamsMap = new Map();

    // Processar todos os jogos para criar estatísticas de cada time
    games.forEach(game => {
      // Inicializar equipes no mapa se ainda não existirem
      if (!teamsMap.has(game.teamA)) {
        teamsMap.set(game.teamA, initTeamStats(game.teamA));
      }

      if (!teamsMap.has(game.teamB)) {
        teamsMap.set(game.teamB, initTeamStats(game.teamB));
      }

      const teamAStats = teamsMap.get(game.teamA);
      const teamBStats = teamsMap.get(game.teamB);

      // Contar jogos disputados
      teamAStats.gamesPlayed += 1;
      teamBStats.gamesPlayed += 1;

      // Contar sets ganhos e pontos totais
      let setsWonByA = 0;
      let setsWonByB = 0;
      let totalPointsA = 0;
      let totalPointsB = 0;

      // Percorrer todos os sets do jogo
      game.sets.forEach(set => {
        // Adicionar pontos de cada set
        totalPointsA += parseInt(set.pointsA);
        totalPointsB += parseInt(set.pointsB);

        // Contar quem ganhou cada set
        if (parseInt(set.pointsA) > parseInt(set.pointsB)) {
          setsWonByA++;
        } else if (parseInt(set.pointsB) > parseInt(set.pointsA)) {
          setsWonByB++;
        }
      });

      // Atualizar estatísticas de sets
      teamAStats.setsWon += setsWonByA;
      teamAStats.setsLost += setsWonByB;
      teamBStats.setsWon += setsWonByB;
      teamBStats.setsLost += setsWonByA;

      // Atualizar pontos marcados/concedidos
      teamAStats.pointsScored += totalPointsA;
      teamAStats.pointsConceded += totalPointsB;
      teamBStats.pointsScored += totalPointsB;
      teamBStats.pointsConceded += totalPointsA;

      // Determinar o vencedor do jogo (quem ganhou mais sets)
      if (setsWonByA > setsWonByB) {
        // Time A venceu: 3 pontos para A, 0 para B
        teamAStats.wins += 1;
        teamAStats.points += 3;
        teamBStats.losses += 1;
      } else {
        // Time B venceu: 3 pontos para B, 0 para A
        teamBStats.wins += 1;
        teamBStats.points += 3;
        teamAStats.losses += 1;
      }
    });

    // Converter o Map para array e ordenar
    const rankingArray = Array.from(teamsMap.values());
    rankingArray.sort((a, b) => {
      // Ordenar primeiro por pontos
      if (b.points !== a.points) return b.points - a.points;
      // Depois por diferença de sets
      const aSetsBalance = a.setsWon - a.setsLost;
      const bSetsBalance = b.setsWon - b.setsLost;
      if (bSetsBalance !== aSetsBalance) return bSetsBalance - aSetsBalance;
      // Depois por diferença de pontos
      const aPointsBalance = a.pointsScored - a.pointsConceded;
      const bPointsBalance = b.pointsScored - b.pointsConceded;
      return bPointsBalance - aPointsBalance;
    });

    // Atualizar o estado do ranking
    setRanking(rankingArray);
  };

  // Função auxiliar para inicializar estatísticas de um time
  const initTeamStats = (teamName) => {
    return {
      name: teamName,
      points: 0,         // Pontos na classificação
      gamesPlayed: 0,    // Jogos disputados
      wins: 0,           // Vitórias
      losses: 0,         // Derrotas
      setsWon: 0,        // Sets ganhos
      setsLost: 0,       // Sets perdidos
      pointsScored: 0,   // Pontos marcados
      pointsConceded: 0  // Pontos concedidos
    };
  };

  // Função para adicionar um novo time
  const handleAddTeam = () => {
    if (!newTeam.trim()) {
      return;
    }
    if (teams.includes(newTeam.trim())) {
      alert('Este time já está cadastrado!');
      return;
    }
    setTeams([...teams, newTeam.trim()]);
    setNewTeam('');
  };

  // Função para remover um time
  const handleRemoveTeam = (teamToRemove) => {
    setTeams(teams.filter(team => team !== teamToRemove));
  };

  // Função para lidar com alterações nos inputs do formulário
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentGame(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Função para lidar com alterações nos pontos dos sets
  const handleSetPointsChange = (setIndex, team, value) => {
    const newSets = [...currentGame.sets];
    newSets[setIndex][`points${team}`] = value;

    setCurrentGame(prev => ({
      ...prev,
      sets: newSets
    }));
  };

  // Função para adicionar ou atualizar um jogo
  const handleSubmitGame = () => {
    // Validações básicas
    if (!currentGame.teamA || !currentGame.teamB) {
      <Alert>
        <AlertDescription>
          Por favor, preencha os nomes das duas equipes.
        </AlertDescription>
      </Alert>
      return;
    }

    if (currentGame.teamA === currentGame.teamB) {
      <Alert>
        <AlertDescription>
          As equipes não podem ser iguais.
        </AlertDescription>
      </Alert>
      return;
    }

    // Verificar se todos os sets têm pontuação
    for (let i = 0; i < currentGame.sets.length; i++) {
      const set = currentGame.sets[i];
      if (set.pointsA <= 0 || set.pointsB <= 0) {
        Alert(<p>Por favor, preencha a pontuação do Set ${i + 1} para ambas as equipes.</p>);
        return;
      }
    }

    // Calcular sets ganhos por cada time
    let setsWonByA = 0;
    let setsWonByB = 0;

    currentGame.sets.forEach(set => {
      if (parseInt(set.pointsA) > parseInt(set.pointsB)) {
        setsWonByA++;
      } else if (parseInt(set.pointsB) > parseInt(set.pointsA)) {
        setsWonByB++;
      }
    });

    // Verificar se tem um vencedor claro
    if (setsWonByA === setsWonByB) {
      <Alert>
        <AlertDescription>
          O jogo deve ter um vencedor. Verifique as pontuações dos sets.
        </AlertDescription>
      </Alert>
      return;
    }

    // Preparar dados do jogo com informações de sets e vencedor
    const gameData = {
      ...currentGame,
      setsWonByA,
      setsWonByB,
      winner: setsWonByA > setsWonByB ? currentGame.teamA : currentGame.teamB
    };

    // Atualizar o estado dos jogos
    if (editingIndex !== null) {
      // Atualizar um jogo existente
      const updatedGames = [...games];
      updatedGames[editingIndex] = gameData;
      setGames(updatedGames);
      setEditingIndex(null);
    } else {
      // Adicionar um novo jogo
      setGames([...games, gameData]);
    }

    // Limpar o formulário
    resetGameForm();
  };

  // Função para editar um jogo existente
  const handleEditGame = (index) => {
    const gameToEdit = games[index];
    setCurrentGame({
      teamA: gameToEdit.teamA,
      teamB: gameToEdit.teamB,
      sets: [...gameToEdit.sets],
      needsThirdSet: gameToEdit.sets.length > 2
    });
    setEditingIndex(index);
  };

  // Função para excluir um jogo
  const handleDeleteGame = (index) => {
    if (confirm('Tem certeza que deseja excluir este jogo?')) {
      const updatedGames = games.filter((_, i) => i !== index);
      setGames(updatedGames);
    }
  };

  // Função para resetar o formulário de jogo
  const resetGameForm = () => {
    setCurrentGame({
      teamA: '',
      teamB: '',
      sets: [
        { pointsA: 0, pointsB: 0 },
        { pointsA: 0, pointsB: 0 }
      ],
      needsThirdSet: false
    });
  };

  // Determinar o vencedor de um set
  const getSetWinner = (set) => {
    if (parseInt(set.pointsA) > parseInt(set.pointsB)) return 'A';
    if (parseInt(set.pointsB) > parseInt(set.pointsA)) return 'B';
    return '-';
  };

  // Renderizar a interface do usuário
  return (
    <div className="max-w-7xl mx-auto p-4" style={{ backgroundColor: colors.background, color: colors.text }}>
      <h1 className="text-3xl font-bold text-center mb-8" style={{ color: colors.primary }}>
        Sistema de Controle de Jogos - Clube Indaiá Dourados/MS
      </h1>

      <Tabs defaultValue="jogos" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="jogos">Jogos</TabsTrigger>
          <TabsTrigger value="times">Times</TabsTrigger>
        </TabsList>

        <TabsContent value="jogos">
          {/* Card para adicionar/editar jogos */}
          <div className="mb-8 p-6 rounded-lg shadow-md" style={{ backgroundColor: 'white' }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: colors.primary }}>
              {editingIndex !== null ? 'Editar Jogo' : 'Registrar Novo Jogo'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Equipe A */}
              <div>
                <label className="block text-sm font-medium mb-1">Nome da Equipe A</label>
                <select
                  name="teamA"
                  value={currentGame.teamA}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-opacity-50"
                  style={{ borderColor: colors.primary, focusRing: colors.secondary }}
                >
                  <option value="">Selecione uma equipe</option>
                  {teams.map((team, index) => (
                    <option key={index} value={team}>{team}</option>
                  ))}
                </select>
              </div>

              {/* Equipe B */}
              <div>
                <label className="block text-sm font-medium mb-1">Nome da Equipe B</label>
                <select
                  name="teamB"
                  value={currentGame.teamB}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-opacity-50"
                  style={{ borderColor: colors.primary, focusRing: colors.secondary }}
                >
                  <option value="">Selecione uma equipe</option>
                  {teams.map((team, index) => (
                    <option key={index} value={team}>{team}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Seção de Sets */}
            <div className="mb-6">
              <h3 className="font-medium mb-3" style={{ color: colors.primary }}>Pontuação por Set</h3>

              <div className="space-y-4">
                {/* Set 1 */}
                <div className="p-4 rounded-md" style={{ backgroundColor: '#f0f9ff' }}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium" style={{ color: colors.text }}>Set 1</h4>
                    <div className="text-sm px-2 py-1 rounded"
                      style={{
                        backgroundColor: getSetWinner(currentGame.sets[0]) === 'A' ? colors.primary :
                          getSetWinner(currentGame.sets[0]) === 'B' ? colors.secondary : 'transparent',
                        color: getSetWinner(currentGame.sets[0]) === '-' ? colors.text : 'white',
                        visibility: (currentGame.sets[0].pointsA > 0 || currentGame.sets[0].pointsB > 0) ? 'visible' : 'hidden'
                      }}>
                      Vencedor: {getSetWinner(currentGame.sets[0]) === 'A' ? currentGame.teamA :
                        getSetWinner(currentGame.sets[0]) === 'B' ? currentGame.teamB : '-'}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-1">{currentGame.teamA || 'Equipe A'}</label>
                      <input
                        type="number"
                        value={currentGame.sets[0].pointsA}
                        onChange={(e) => handleSetPointsChange(0, 'A', e.target.value)}
                        className="w-full p-2 border rounded-md"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">{currentGame.teamB || 'Equipe B'}</label>
                      <input
                        type="number"
                        value={currentGame.sets[0].pointsB}
                        onChange={(e) => handleSetPointsChange(0, 'B', e.target.value)}
                        className="w-full p-2 border rounded-md"
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Set 2 */}
                <div className="p-4 rounded-md" style={{ backgroundColor: '#f0f9ff' }}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium" style={{ color: colors.text }}>Set 2</h4>
                    <div className="text-sm px-2 py-1 rounded"
                      style={{
                        backgroundColor: getSetWinner(currentGame.sets[1]) === 'A' ? colors.primary :
                          getSetWinner(currentGame.sets[1]) === 'B' ? colors.secondary : 'transparent',
                        color: getSetWinner(currentGame.sets[1]) === '-' ? colors.text : 'white',
                        visibility: (currentGame.sets[1].pointsA > 0 || currentGame.sets[1].pointsB > 0) ? 'visible' : 'hidden'
                      }}>
                      Vencedor: {getSetWinner(currentGame.sets[1]) === 'A' ? currentGame.teamA :
                        getSetWinner(currentGame.sets[1]) === 'B' ? currentGame.teamB : '-'}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-1">{currentGame.teamA || 'Equipe A'}</label>
                      <input
                        type="number"
                        value={currentGame.sets[1].pointsA}
                        onChange={(e) => handleSetPointsChange(1, 'A', e.target.value)}
                        className="w-full p-2 border rounded-md"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">{currentGame.teamB || 'Equipe B'}</label>
                      <input
                        type="number"
                        value={currentGame.sets[1].pointsB}
                        onChange={(e) => handleSetPointsChange(1, 'B', e.target.value)}
                        className="w-full p-2 border rounded-md"
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Set 3 (condicional) */}
                {currentGame.needsThirdSet && currentGame.sets.length > 2 && (
                  <div className="p-4 rounded-md" style={{ backgroundColor: '#f0f9ff', borderLeft: `4px solid ${colors.accent}` }}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium" style={{ color: colors.text }}>Set 3 (Desempate)</h4>
                      <div className="text-sm px-2 py-1 rounded"
                        style={{
                          backgroundColor: getSetWinner(currentGame.sets[2]) === 'A' ? colors.primary :
                            getSetWinner(currentGame.sets[2]) === 'B' ? colors.secondary : 'transparent',
                          color: getSetWinner(currentGame.sets[2]) === '-' ? colors.text : 'white',
                          visibility: (currentGame.sets[2].pointsA > 0 || currentGame.sets[2].pointsB > 0) ? 'visible' : 'hidden'
                        }}>
                        Vencedor: {getSetWinner(currentGame.sets[2]) === 'A' ? currentGame.teamA :
                          getSetWinner(currentGame.sets[2]) === 'B' ? currentGame.teamB : '-'}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm mb-1">{currentGame.teamA || 'Equipe A'}</label>
                        <input
                          type="number"
                          value={currentGame.sets[2].pointsA}
                          onChange={(e) => handleSetPointsChange(2, 'A', e.target.value)}
                          className="w-full p-2 border rounded-md"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">{currentGame.teamB || 'Equipe B'}</label>
                        <input
                          type="number"
                          value={currentGame.sets[2].pointsB}
                          onChange={(e) => handleSetPointsChange(2, 'B', e.target.value)}
                          className="w-full p-2 border rounded-md"
                          min="0"
                        />
                      </div>
                    </div>

                    <Alert className="mt-2" variant="info" style={{ backgroundColor: '#FFF9C4', borderColor: colors.accent }}>
                      <AlertDescription>
                        Este set de desempate foi adicionado automaticamente porque cada equipe venceu um set.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex justify-end space-x-2">
              {editingIndex !== null && (
                <button
                  onClick={() => {
                    setEditingIndex(null);
                    resetGameForm();
                  }}
                  className="px-4 py-2 rounded-md border"
                  style={{ borderColor: colors.primary, color: colors.primary }}
                >
                  Cancelar
                </button>
              )}
              <button
                onClick={handleSubmitGame}
                className="px-4 py-2 rounded-md text-white"
                style={{ backgroundColor: colors.primary }}
              >
                {editingIndex !== null ? 'Salvar Alterações' : 'Registrar Jogo'}
              </button>
            </div>
          </div>

          {/* Tabela de Jogos */}
          <div className="mb-8 p-6 rounded-lg shadow-md" style={{ backgroundColor: 'white' }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: colors.primary }}>Tabela de Jogos</h2>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead style={{ backgroundColor: colors.primary }}>
                  <tr>
                    <th className="px-4 py-2 text-left text-white">#</th>
                    <th className="px-4 py-2 text-left text-white">Equipe A</th>
                    <th className="px-4 py-2 text-left text-white">Equipe B</th>
                    <th className="px-4 py-2 text-left text-white">Set 1</th>
                    <th className="px-4 py-2 text-left text-white">Set 2</th>
                    <th className="px-4 py-2 text-left text-white">Set 3</th>
                    <th className="px-4 py-2 text-left text-white">Vencedor</th>
                    <th className="px-4 py-2 text-left text-white">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {games.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-4 py-4 text-center text-gray-500">
                        Nenhum jogo registrado ainda
                      </td>
                    </tr>
                  ) : (
                    games.map((game, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="px-4 py-3">{index + 1}</td>
                        <td className="px-4 py-3">{game.teamA}</td>
                        <td className="px-4 py-3">{game.teamB}</td>
                        <td className="px-4 py-3">
                          {game.sets[0].pointsA} x {game.sets[0].pointsB}
                        </td>
                        <td className="px-4 py-3">
                          {game.sets[1].pointsA} x {game.sets[1].pointsB}
                        </td>
                        <td className="px-4 py-3">
                          {game.sets.length > 2 ? `${game.sets[2].pointsA} x ${game.sets[2].pointsB}` : '-'}
                        </td>
                        <td className="px-4 py-3 font-medium" style={{ color: colors.primary }}>
                          {game.winner}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditGame(index)}
                              className="px-2 py-1 text-sm rounded text-white"
                              style={{ backgroundColor: colors.secondary }}
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeleteGame(index)}
                              className="px-2 py-1 text-sm rounded bg-red-500 text-white"
                            >
                              Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tabela de Classificação */}
          <div className="p-6 rounded-lg shadow-md" style={{ backgroundColor: 'white' }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: colors.primary }}>Classificação</h2>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead style={{ backgroundColor: colors.primary }}>
                  <tr>
                    <th className="px-4 py-2 text-left text-white">Pos.</th>
                    <th className="px-4 py-2 text-left text-white">Equipe</th>
                    <th className="px-4 py-2 text-left text-white">P</th>
                    <th className="px-4 py-2 text-left text-white">J</th>
                    <th className="px-4 py-2 text-left text-white">V</th>
                    <th className="px-4 py-2 text-left text-white">D</th>
                    <th className="px-4 py-2 text-left text-white">Sets (G-P)</th>
                    <th className="px-4 py-2 text-left text-white">Pontos (M-S)</th>
                    <th className="px-4 py-2 text-left text-white">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {ranking.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-4 py-4 text-center text-gray-500">
                        Nenhuma equipe na classificação ainda
                      </td>
                    </tr>
                  ) : (
                    ranking.map((team, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="px-4 py-3 font-bold">{index + 1}</td>
                        <td className="px-4 py-3">{team.name}</td>
                        <td className="px-4 py-3 font-medium" style={{ color: colors.primary }}>{team.points}</td>
                        <td className="px-4 py-3">{team.gamesPlayed}</td>
                        <td className="px-4 py-3">{team.wins}</td>
                        <td className="px-4 py-3">{team.losses}</td>
                        <td className="px-4 py-3">{team.setsWon}-{team.setsLost}</td>
                        <td className="px-4 py-3">{team.pointsScored}-{team.pointsConceded}</td>
                        <td className="px-4 py-3" style={{
                          color: team.pointsScored - team.pointsConceded > 0 ? 'green' :
                            team.pointsScored - team.pointsConceded < 0 ? 'red' : 'inherit'
                        }}>
                          {team.pointsScored - team.pointsConceded}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="times">
          <div className="mb-8 p-6 rounded-lg shadow-md" style={{ backgroundColor: 'white' }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: colors.primary }}>
              Cadastro de Times
            </h2>

            <div className="flex gap-4 mb-6">
              <input
                type="text"
                value={newTeam}
                onChange={(e) => setNewTeam(e.target.value)}
                className="flex-1 p-2 border rounded-md"
                placeholder="Nome do time"
                style={{ borderColor: colors.primary }}
              />
              <button
                onClick={handleAddTeam}
                className="px-4 py-2 rounded-md text-white"
                style={{ backgroundColor: colors.primary }}
              >
                Adicionar Time
              </button>
            </div>

            <div className="space-y-2">
              {teams.map((team, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <span>{team}</span>
                  <button
                    onClick={() => handleRemoveTeam(team)}
                    className="px-2 py-1 text-sm rounded bg-red-500 text-white"
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Rodapé */}
      <div className="mt-8 text-center text-sm" style={{ color: colors.text }}>
        © 2025 Sistema de Controle de Jogos de Vôlei - Clube Indaiá Dourados/MS
      </div>
    </div>
  );
};

export default IndaiaVolleyballSystem;