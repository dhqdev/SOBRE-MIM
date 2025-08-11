import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gamepad2, Brain, Scissors, Grid3X3 } from 'lucide-react';

const GamesSection = () => {
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [ticTacBoard, setTicTacBoard] = useState(Array(9).fill(''));
  const [currentPlayer, setCurrentPlayer] = useState('X');
  const [gameWinner, setGameWinner] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [rpsChoice, setRpsChoice] = useState<string | null>(null);
  const [rpsResult, setRpsResult] = useState<string | null>(null);

  const quizQuestions = [
    {
      question: "Qual linguagem eu mais uso no desenvolvimento?",
      options: ["Python", "JavaScript", "Java", "C++"],
      correct: 1
    },
    {
      question: "Qual é o meu framework front-end favorito?",
      options: ["Vue.js", "Angular", "React", "Svelte"],
      correct: 2
    },
    {
      question: "Em qual empresa trabalho atualmente?",
      options: ["Google", "Microsoft", "Nubank", "Meta"],
      correct: 2
    }
  ];

  const checkWinner = (board: string[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    
    for (let line of lines) {
      const [a, b, c] = line;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    return board.includes('') ? null : 'Empate';
  };

  const handleTicTacMove = (index: number) => {
    if (ticTacBoard[index] || gameWinner) return;
    
    const newBoard = [...ticTacBoard];
    newBoard[index] = currentPlayer;
    setTicTacBoard(newBoard);
    
    const winner = checkWinner(newBoard);
    if (winner) {
      setGameWinner(winner);
    } else {
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
    }
  };

  const resetTicTac = () => {
    setTicTacBoard(Array(9).fill(''));
    setCurrentPlayer('X');
    setGameWinner(null);
  };

  const handleQuizAnswer = (answerIndex: number) => {
    if (answerIndex === quizQuestions[currentQuestion].correct) {
      setQuizScore(quizScore + 1);
    }
    
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Quiz finished
      setTimeout(() => {
        setCurrentQuestion(0);
        setQuizScore(0);
      }, 3000);
    }
  };

  const playRPS = (playerChoice: string) => {
    const choices = ['pedra', 'papel', 'tesoura'];
    const computerChoice = choices[Math.floor(Math.random() * 3)];
    setRpsChoice(computerChoice);
    
    let result;
    if (playerChoice === computerChoice) {
      result = 'Empate!';
    } else if (
      (playerChoice === 'pedra' && computerChoice === 'tesoura') ||
      (playerChoice === 'papel' && computerChoice === 'pedra') ||
      (playerChoice === 'tesoura' && computerChoice === 'papel')
    ) {
      result = 'Você ganhou! 🎉';
    } else {
      result = 'Eu ganhei! 😄';
    }
    
    setRpsResult(result);
    setTimeout(() => {
      setRpsChoice(null);
      setRpsResult(null);
    }, 3000);
  };

  const games = [
    {
      id: 'tictac',
      title: 'Jogo da Velha',
      icon: Grid3X3,
      description: 'Clássico jogo da velha contra mim!'
    },
    {
      id: 'quiz',
      title: 'Quiz sobre Mim',
      icon: Brain,
      description: 'Teste seus conhecimentos sobre minha carreira!'
    },
    {
      id: 'rps',
      title: 'Pedra, Papel, Tesoura',
      icon: Scissors,
      description: 'Jogo rápido e divertido!'
    }
  ];

  return (
    <section className="py-20 px-4 relative">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16 reveal-on-scroll">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Gamepad2 className="w-8 h-8 text-primary" />
            <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Vamos Jogar?
            </h2>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Que tal uma pausa? Escolha um jogo e vamos nos divertir juntos! 🎮
          </p>
        </div>

        {!activeGame && (
          <div className="grid md:grid-cols-3 gap-6 reveal-on-scroll">
            {games.map((game) => (
              <Card 
                key={game.id}
                className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 border-primary/20 hover:border-primary/40"
                onClick={() => setActiveGame(game.id)}
              >
                <CardHeader className="text-center">
                  <game.icon className="w-12 h-12 text-primary mx-auto mb-3" />
                  <CardTitle className="text-xl">{game.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center mb-4">
                    {game.description}
                  </p>
                  <Button className="w-full" variant="outline">
                    Jogar Agora
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeGame === 'tictac' && (
          <Card className="max-w-md mx-auto reveal-on-scroll">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Grid3X3 className="w-6 h-6" />
                Jogo da Velha
              </CardTitle>
              {gameWinner ? (
                <Badge variant="outline" className="mx-auto">
                  {gameWinner === 'Empate' ? 'Empate!' : `${gameWinner} Ganhou!`}
                </Badge>
              ) : (
                <Badge variant="outline" className="mx-auto">
                  Vez do: {currentPlayer}
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {ticTacBoard.map((cell, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="aspect-square text-2xl font-bold"
                    onClick={() => handleTicTacMove(index)}
                    disabled={!!cell || !!gameWinner}
                  >
                    {cell}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button onClick={resetTicTac} variant="outline" className="flex-1">
                  Novo Jogo
                </Button>
                <Button onClick={() => setActiveGame(null)} variant="secondary" className="flex-1">
                  Voltar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeGame === 'quiz' && (
          <Card className="max-w-2xl mx-auto reveal-on-scroll">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Brain className="w-6 h-6" />
                Quiz sobre Mim
              </CardTitle>
              <Badge variant="outline" className="mx-auto">
                Pergunta {currentQuestion + 1}/{quizQuestions.length} | Pontos: {quizScore}
              </Badge>
            </CardHeader>
            <CardContent>
              {currentQuestion < quizQuestions.length ? (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-center">
                    {quizQuestions[currentQuestion].question}
                  </h3>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {quizQuestions[currentQuestion].options.map((option, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        onClick={() => handleQuizAnswer(index)}
                        className="text-left justify-start"
                      >
                        {option}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-2">Quiz Finalizado! 🎉</h3>
                  <p className="text-lg mb-4">
                    Você acertou {quizScore} de {quizQuestions.length} perguntas!
                  </p>
                  <Badge variant="outline" className="text-lg px-4 py-2">
                    {quizScore === quizQuestions.length ? 'Perfeito!' : 
                     quizScore >= quizQuestions.length/2 ? 'Muito bem!' : 'Pode melhorar!'}
                  </Badge>
                </div>
              )}
              <Button onClick={() => setActiveGame(null)} variant="secondary" className="w-full mt-4">
                Voltar aos Jogos
              </Button>
            </CardContent>
          </Card>
        )}

        {activeGame === 'rps' && (
          <Card className="max-w-md mx-auto reveal-on-scroll">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Scissors className="w-6 h-6" />
                Pedra, Papel, Tesoura
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <p className="text-lg mb-4">Escolha sua jogada:</p>
                <div className="flex justify-center gap-4 mb-4">
                  <Button
                    variant="outline"
                    className="text-2xl p-4"
                    onClick={() => playRPS('pedra')}
                    disabled={!!rpsChoice}
                  >
                    🪨
                  </Button>
                  <Button
                    variant="outline"
                    className="text-2xl p-4"
                    onClick={() => playRPS('papel')}
                    disabled={!!rpsChoice}
                  >
                    📄
                  </Button>
                  <Button
                    variant="outline"
                    className="text-2xl p-4"
                    onClick={() => playRPS('tesoura')}
                    disabled={!!rpsChoice}
                  >
                    ✂️
                  </Button>
                </div>
                
                {rpsChoice && (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-2">Eu escolhi:</p>
                    <div className="text-4xl mb-2">
                      {rpsChoice === 'pedra' ? '🪨' : rpsChoice === 'papel' ? '📄' : '✂️'}
                    </div>
                    <Badge variant="outline" className="text-lg">
                      {rpsResult}
                    </Badge>
                  </div>
                )}
              </div>
              
              <Button onClick={() => setActiveGame(null)} variant="secondary" className="w-full">
                Voltar aos Jogos
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
};

export default GamesSection;