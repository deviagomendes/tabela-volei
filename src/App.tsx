import { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from "sonner";
import { Toaster } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, PrinterIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Set {
  pointsA: number;
  pointsB: number;
}

interface Game {
  teamA: string;
  teamB: string;
  sets: Set[];
  needsThirdSet: boolean;
  winner?: string;
  date: string;
}

interface TeamStats {
  name: string;
  gamesPlayed: number;
  setsWon: number;
  setsLost: number;
  pointsWon: number;
  pointsLost: number;
  gamesWon: number;
  gamesLost: number;
  points: number;
}

const IndaiaVolleyballSystem = () => {
  // Adicionar ref para o formulário
  const formRef = useRef<HTMLDivElement>(null);

  // Estados para armazenar os jogos e ranking
  const [games, setGames] = useState<Game[]>(() => {
    const savedGames = localStorage.getItem('volleyball-games');
    return savedGames ? JSON.parse(savedGames) : [];
  });

  const [ranking, setRanking] = useState<TeamStats[]>([]);
  const [teams, setTeams] = useState<string[]>(() => {
    const savedTeams = localStorage.getItem('volleyball-teams');
    return savedTeams ? JSON.parse(savedTeams) : [];
  });
  const [newTeam, setNewTeam] = useState('');

  // Estado para o jogo atual sendo adicionado/editado
  const [currentGame, setCurrentGame] = useState<Game>({
    teamA: '',
    teamB: '',
    sets: [
      { pointsA: 0, pointsB: 0 },
      { pointsA: 0, pointsB: 0 },
      { pointsA: 0, pointsB: 0 }
    ],
    needsThirdSet: false,
    date: new Date().toISOString()
  });

  // Estado para controlar o modo de edição
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Cores do Clube Indaiá Dourados/MS
  const colors = {
    primary: '#006400', // Verde escuro
    secondary: '#FFD700', // Dourado
    accent: '#FFFF00', // Amarelo
    background: '#F0F8FF', // Azul claro
    text: '#004225' // Verde escuro para texto
  } as const;

  // Efeito para verificar se precisa de um terceiro set (quando cada time ganhou 1 set)
  useEffect(() => {
    // Garantir que sempre temos 3 sets
    if (currentGame.sets.length < 3) {
      setCurrentGame(prev => ({
        ...prev,
        sets: [
          ...prev.sets,
          ...Array(3 - prev.sets.length).fill({ pointsA: 0, pointsB: 0 })
        ]
      }));
      return;
    }

    const set1Winner = currentGame.sets[0].pointsA > currentGame.sets[0].pointsB ? 'A' : 'B';
    const set2Winner = currentGame.sets[1].pointsA > currentGame.sets[1].pointsB ? 'A' : 'B';

    // Se os vencedores dos dois primeiros sets forem diferentes, precisamos de um terceiro set
    if (currentGame.sets[0].pointsA > 0 && currentGame.sets[0].pointsB > 0 &&
      currentGame.sets[1].pointsA > 0 && currentGame.sets[1].pointsB > 0 &&
      set1Winner !== set2Winner) {
      setCurrentGame(prev => ({
        ...prev,
        needsThirdSet: true
      }));
    } else {
      setCurrentGame(prev => ({
        ...prev,
        needsThirdSet: false
      }));
    }
  }, [currentGame.sets]);

  // Efeito para calcular o ranking sempre que os jogos são atualizados
  useEffect(() => {
    calculateRanking();
  }, [games]);

  // Efeito para salvar jogos no localStorage
  useEffect(() => {
    localStorage.setItem('volleyball-games', JSON.stringify(games));
  }, [games]);

  // Efeito para salvar times no localStorage
  useEffect(() => {
    localStorage.setItem('volleyball-teams', JSON.stringify(teams));
  }, [teams]);

  // Função para calcular o ranking das equipes
  const calculateRanking = () => {
    const teamsMap = new Map<string, TeamStats>();

    // Processar todos os jogos para criar estatísticas de cada time
    games.forEach(game => {
      // Inicializar equipes no mapa se ainda não existirem
      if (!teamsMap.has(game.teamA)) {
        teamsMap.set(game.teamA, initTeamStats(game.teamA));
      }

      if (!teamsMap.has(game.teamB)) {
        teamsMap.set(game.teamB, initTeamStats(game.teamB));
      }

      const teamAStats = teamsMap.get(game.teamA)!;
      const teamBStats = teamsMap.get(game.teamB)!;

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
        totalPointsA += set.pointsA;
        totalPointsB += set.pointsB;

        // Contar quem ganhou cada set
        if (set.pointsA > set.pointsB) {
          setsWonByA++;
        } else if (set.pointsB > set.pointsA) {
          setsWonByB++;
        }
      });

      // Atualizar estatísticas de sets
      teamAStats.setsWon += setsWonByA;
      teamAStats.setsLost += setsWonByB;
      teamBStats.setsWon += setsWonByB;
      teamBStats.setsLost += setsWonByA;

      // Atualizar pontos marcados/concedidos
      teamAStats.pointsWon += totalPointsA;
      teamAStats.pointsLost += totalPointsB;
      teamBStats.pointsWon += totalPointsB;
      teamBStats.pointsLost += totalPointsA;

      // Determinar o vencedor do jogo (quem ganhou mais sets)
      if (setsWonByA > setsWonByB) {
        // Time A venceu
        teamAStats.gamesWon += 1;
        teamAStats.points += 3;
        teamBStats.gamesLost += 1;
        teamBStats.points += 1;
      } else {
        // Time B venceu
        teamBStats.gamesWon += 1;
        teamBStats.points += 3;
        teamAStats.gamesLost += 1;
        teamAStats.points += 1;
      }
    });

    // Converter o Map para array e ordenar
    const rankingArray = Array.from(teamsMap.values());
    rankingArray.sort((a, b) => {
      // Ordenar primeiro por pontos do campeonato
      if (b.points !== a.points) return b.points - a.points;
      // Se empatar em pontos, ordenar por saldo de pontos
      const aPointsBalance = a.pointsWon - a.pointsLost;
      const bPointsBalance = b.pointsWon - b.pointsLost;
      return bPointsBalance - aPointsBalance;
    });

    // Atualizar o estado do ranking
    setRanking(rankingArray);
  };

  // Função auxiliar para inicializar estatísticas de um time
  const initTeamStats = (teamName: string): TeamStats => {
    return {
      name: teamName,
      gamesPlayed: 0,
      setsWon: 0,
      setsLost: 0,
      pointsWon: 0,
      pointsLost: 0,
      gamesWon: 0,
      gamesLost: 0,
      points: 0
    };
  };

  // Função para adicionar um novo time
  const handleAddTeam = () => {
    if (!newTeam.trim()) {
      toast.error("O nome do time não pode estar vazio.");
      return;
    }
    if (teams.includes(newTeam.trim())) {
      toast.error("Este time já está cadastrado!");
      return;
    }
    setTeams([...teams, newTeam.trim()]);
    setNewTeam('');
    toast.success("Time adicionado com sucesso!");
  };

  // Função para remover um time
  const handleRemoveTeam = (teamToRemove: string) => {
    // Verificar se o time está em algum jogo
    const isTeamInGames = games.some(game =>
      game.teamA === teamToRemove || game.teamB === teamToRemove
    );

    if (isTeamInGames) {
      toast.error("Não é possível remover um time que já participou de jogos.");
      return;
    }

    setTeams(teams.filter(team => team !== teamToRemove));
    toast.success("Time removido com sucesso!");
  };

  // Função para lidar com alterações nos inputs do formulário
  const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentGame(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Função para lidar com alterações nos pontos dos sets
  const handleSetPointsChange = (setIndex: number, team: 'A' | 'B', value: string) => {
    const newValue = parseInt(value) || 0;
    const newSets = [...currentGame.sets];
    newSets[setIndex][`points${team}`] = newValue;

    setCurrentGame(prev => ({
      ...prev,
      sets: newSets
    }));
  };

  // Função para validar e adicionar um jogo
  const handleAddGame = () => {
    // Verificar se os times foram selecionados
    if (!currentGame.teamA || !currentGame.teamB) {
      toast.error("Por favor, selecione os dois times.");
      return;
    }

    // Verificar se pelo menos dois sets têm pontuação
    const setsWithPoints = currentGame.sets.filter(set => set.pointsA > 0 || set.pointsB > 0).length;
    if (setsWithPoints < 2) {
      toast.error("É necessário preencher pelo menos dois sets.");
      return;
    }

    // Verificar se há um vencedor claro
    let setsWonA = 0;
    let setsWonB = 0;

    currentGame.sets.forEach(set => {
      if (set.pointsA > set.pointsB) setsWonA++;
      else if (set.pointsB > set.pointsA) setsWonB++;
    });

    if (setsWonA === setsWonB) {
      toast.error("Não pode haver empate. Um time deve vencer mais sets que o outro.");
      return;
    }

    // Criar uma cópia do jogo atual
    const newGame = {
      ...currentGame,
      sets: currentGame.sets.map(set => ({
        pointsA: set.pointsA || 0,
        pointsB: set.pointsB || 0
      })),
      winner: setsWonA > setsWonB ? currentGame.teamA : currentGame.teamB
    };

    if (editingIndex !== null) {
      // Atualizar jogo existente
      const updatedGames = [...games];
      updatedGames[editingIndex] = newGame;
      setGames(updatedGames);
      toast.success("Jogo atualizado com sucesso!");
    } else {
      // Adicionar novo jogo
      setGames([...games, newGame]);
      toast.success("Jogo registrado com sucesso!");
    }

    // Resetar o formulário
    resetGameForm();
  };

  // Função para editar um jogo existente
  const handleEditGame = (index: number) => {
    const gameToEdit = games[index];
    const sets = [
      gameToEdit.sets[0] || { pointsA: 0, pointsB: 0 },
      gameToEdit.sets[1] || { pointsA: 0, pointsB: 0 },
      gameToEdit.sets[2] || { pointsA: 0, pointsB: 0 }
    ];

    setCurrentGame({
      teamA: gameToEdit.teamA,
      teamB: gameToEdit.teamB,
      sets,
      needsThirdSet: gameToEdit.sets.length > 2,
      date: gameToEdit.date || new Date().toISOString()
    });
    setEditingIndex(index);
    
    // Scroll suave até o formulário
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    toast.info("Modo de edição ativado. Faça as alterações necessárias.");
  };

  // Função para excluir um jogo
  const handleDeleteGame = (index: number) => {
    if (confirm('Tem certeza que deseja excluir este jogo?')) {
      const updatedGames = games.filter((_, i) => i !== index);
      setGames(updatedGames);
      toast.success("Jogo excluído com sucesso!");
    }
  };

  // Função para resetar o formulário de jogo
  const resetGameForm = () => {
    setCurrentGame({
      teamA: '',
      teamB: '',
      sets: [
        { pointsA: 0, pointsB: 0 },
        { pointsA: 0, pointsB: 0 },
        { pointsA: 0, pointsB: 0 }
      ],
      needsThirdSet: false,
      date: new Date().toISOString()
    });
    if (editingIndex !== null) {
      setEditingIndex(null);
      toast.info("Edição cancelada.");
    }
  };

  // Função para formatar a data
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return format(date, "EEEE, dd/MM/yyyy", { locale: ptBR });
    } catch (error) {
      return 'N/A';
    }
  };

  // Determinar o vencedor de um set
  const getSetWinner = (set: Set | undefined): 'A' | 'B' | '-' => {
    if (!set) return '-';
    if (set.pointsA > set.pointsB) return 'A';
    if (set.pointsB > set.pointsA) return 'B';
    return '-';
  };

  // Função para imprimir uma seção específica
  const handlePrint = (section: 'ranking' | 'games') => {
    const printContent = document.getElementById(section);
    if (!printContent) return;

    const originalDisplay = document.body.style.display;
    const originalOverflow = document.body.style.overflow;
    const originalBackground = document.body.style.backgroundColor;

    // Criar um iframe para impressão
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) return;

    // Adicionar estilos e conteúdo ao iframe
    iframeDoc.write(`
      <html>
        <head>
          <title>Impressão - ${section === 'ranking' ? 'Classificação' : 'Jogos'}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: ${colors.primary};
              color: white;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
            .header h1 {
              color: ${colors.primary};
              margin-bottom: 10px;
            }
            .header p {
              color: #666;
            }
            @media print {
              body {
                margin: 0;
                padding: 20px;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Sistema de Controle de Jogos - Clube Indaiá Dourados/MS</h1>
            <p>${section === 'ranking' ? 'Tabela de Classificação' : 'Tabela de Jogos'}</p>
            <p>Data de impressão: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
          </div>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    // Imprimir
    iframe.contentWindow?.print();

    // Limpar
    document.body.removeChild(iframe);
    document.body.style.display = originalDisplay;
    document.body.style.overflow = originalOverflow;
    document.body.style.backgroundColor = originalBackground;
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
          <div ref={formRef} className="mb-8 p-6 rounded-lg shadow-md" style={{ backgroundColor: 'white' }}>
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
                  style={{ borderColor: colors.primary }}
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
                  style={{ borderColor: colors.primary }}
                >
                  <option value="">Selecione uma equipe</option>
                  {teams.map((team, index) => (
                    <option key={index} value={team}>{team}</option>
                  ))}
                </select>
              </div>

              {/* Data do Jogo */}
              <div>
                <label className="block text-sm font-medium mb-1">Data do Jogo</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      style={{ borderColor: colors.primary }}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formatDate(currentGame.date)}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={new Date(currentGame.date)}
                      onSelect={(date) => date && setCurrentGame(prev => ({ ...prev, date: date.toISOString() }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
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
                        value={currentGame.sets[0].pointsA || ''}
                        onChange={(e) => handleSetPointsChange(0, 'A', e.target.value)}
                        className="w-full p-2 border rounded-md"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">{currentGame.teamB || 'Equipe B'}</label>
                      <input
                        type="number"
                        value={currentGame.sets[0].pointsB || ''}
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
                        value={currentGame.sets[1].pointsA || ''}
                        onChange={(e) => handleSetPointsChange(1, 'A', e.target.value)}
                        className="w-full p-2 border rounded-md"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">{currentGame.teamB || 'Equipe B'}</label>
                      <input
                        type="number"
                        value={currentGame.sets[1].pointsB || ''}
                        onChange={(e) => handleSetPointsChange(1, 'B', e.target.value)}
                        className="w-full p-2 border rounded-md"
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Set 3 */}
                <div className="p-4 rounded-md" style={{ backgroundColor: '#f0f9ff' }}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium" style={{ color: colors.text }}>Set 3</h4>
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
                        value={currentGame.sets[2].pointsA || ''}
                        onChange={(e) => handleSetPointsChange(2, 'A', e.target.value)}
                        className="w-full p-2 border rounded-md"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">{currentGame.teamB || 'Equipe B'}</label>
                      <input
                        type="number"
                        value={currentGame.sets[2].pointsB || ''}
                        onChange={(e) => handleSetPointsChange(2, 'B', e.target.value)}
                        className="w-full p-2 border rounded-md"
                        min="0"
                      />
                    </div>
                  </div>
                </div>
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
                onClick={handleAddGame}
                className="px-4 py-2 rounded-md text-white"
                style={{ backgroundColor: colors.primary }}
              >
                {editingIndex !== null ? 'Salvar Alterações' : 'Registrar Jogo'}
              </button>
            </div>
          </div>

          {/* Tabela de Jogos */}
          <div className="mb-8 p-6 rounded-lg shadow-md" style={{ backgroundColor: 'white' }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold" style={{ color: colors.primary }}>Tabela de Jogos</h2>
              <Button
                onClick={() => handlePrint('games')}
                className="flex items-center gap-2"
                style={{ backgroundColor: colors.primary }}
              >
                <PrinterIcon className="h-4 w-4" />
                Imprimir Jogos
              </Button>
            </div>

            <div id="games" className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead style={{ backgroundColor: colors.primary }}>
                  <tr>
                    <th className="px-4 py-2 text-left text-white">#</th>
                    <th className="px-4 py-2 text-left text-white">Data</th>
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
                      <td colSpan={9} className="px-4 py-4 text-center text-gray-500">
                        Nenhum jogo registrado ainda
                      </td>
                    </tr>
                  ) : (
                    games.map((game, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="px-4 py-3">{index + 1}</td>
                        <td className="px-4 py-3">{formatDate(game.date)}</td>
                        <td className="px-4 py-3">{game.teamA}</td>
                        <td className="px-4 py-3">{game.teamB}</td>
                        <td className="px-4 py-3">
                          {game.sets[0] && (game.sets[0].pointsA > 0 || game.sets[0].pointsB > 0)
                            ? `${game.sets[0].pointsA} x ${game.sets[0].pointsB}`
                            : 'N/A'}
                        </td>
                        <td className="px-4 py-3">
                          {game.sets[1] && (game.sets[1].pointsA > 0 || game.sets[1].pointsB > 0)
                            ? `${game.sets[1].pointsA} x ${game.sets[1].pointsB}`
                            : 'N/A'}
                        </td>
                        <td className="px-4 py-3">
                          {game.sets[2] && (game.sets[2].pointsA > 0 || game.sets[2].pointsB > 0)
                            ? `${game.sets[2].pointsA} x ${game.sets[2].pointsB}`
                            : 'N/A'}
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold" style={{ color: colors.primary }}>Classificação</h2>
              <Button
                onClick={() => handlePrint('ranking')}
                className="flex items-center gap-2"
                style={{ backgroundColor: colors.primary }}
              >
                <PrinterIcon className="h-4 w-4" />
                Imprimir Classificação
              </Button>
            </div>

            <div className="mb-4 text-sm text-gray-600">
              <p><strong>Pos.</strong> - Posição na classificação</p>
              <p><strong>Equipe</strong> - Nome da equipe</p>
              <p><strong>Pts</strong> - Pontos do campeonato</p>
              <p><strong>J</strong> - Total de jogos disputados</p>
              <p><strong>V</strong> - Vitórias</p>
              <p><strong>D</strong> - Derrotas</p>
              <p><strong>Sets (P x C)</strong> - Sets ganhos (PRO) e perdidos (CONTRA)</p>
              <p><strong>Pontos (P x C)</strong> - Pontos marcados (PRO) e sofridos (CONTRA)</p>
              <p><strong>Saldo</strong> - Diferença entre pontos marcados e sofridos</p>
            </div>

            <div id="ranking" className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead style={{ backgroundColor: colors.primary }}>
                  <tr>
                    <th className="px-4 py-2 text-left text-white">Pos.</th>
                    <th className="px-4 py-2 text-left text-white">Equipe</th>
                    <th className="px-4 py-2 text-left text-white">Pts</th>
                    <th className="px-4 py-2 text-left text-white">J</th>
                    <th className="px-4 py-2 text-left text-white">V</th>
                    <th className="px-4 py-2 text-left text-white">D</th>
                    <th className="px-4 py-2 text-left text-white">Sets (P x C)</th>
                    <th className="px-4 py-2 text-left text-white">Pontos (P x C)</th>
                    <th className="px-4 py-2 text-left text-white">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {ranking.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-4 text-center text-gray-500">
                        Nenhuma equipe na classificação ainda
                      </td>
                    </tr>
                  ) : (
                    ranking.map((team, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="px-4 py-3 font-bold">{index + 1}</td>
                        <td className="px-4 py-3">{team.name}</td>
                        <td className="px-4 py-3 font-bold">{team.points}</td>
                        <td className="px-4 py-3">{team.gamesPlayed}</td>
                        <td className="px-4 py-3">{team.gamesWon}</td>
                        <td className="px-4 py-3">{team.gamesLost}</td>
                        <td className="px-4 py-3">{team.setsWon} x {team.setsLost}</td>
                        <td className="px-4 py-3">{team.pointsWon} x {team.pointsLost}</td>
                        <td className="px-4 py-3" style={{
                          color: team.pointsWon - team.pointsLost > 0 ? 'green' :
                            team.pointsWon - team.pointsLost < 0 ? 'red' : 'inherit'
                        }}>
                          {team.pointsWon - team.pointsLost}
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
        © {new Date().getFullYear()} • Sistema de Controle de Jogos de Vôlei • Clube Indaiá Dourados/MS • Desenvolvido por Iago Aquino Mendes
      </div>
      <Toaster />
    </div>
  );
};

export default IndaiaVolleyballSystem;