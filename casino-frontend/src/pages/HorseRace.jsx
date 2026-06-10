import React, { useEffect, useMemo, useState, useRef } from 'react';
import RaceTrack, { getRaceOrder } from '../components/RaceTrack';

const defaultHorses = [
	{
		id: 'h1',
		name: 'Szybki Paweł',
		odds: 2.8,
		color: '#E11D48',
		history: ['1st', '3rd', '2nd', '1st', '4th'],
	},
	{
		id: 'h2',
		name: 'Pan Kopytnik',
		odds: 3.2,
		color: '#2563EB',
		history: ['4th', '2nd', '1st', '3rd', '2nd'],
	},
	{
		id: 'h3',
		name: 'Rumak Rysiek',
		odds: 4.5,
		color: '#F59E0B',
		history: ['2nd', '5th', '3rd', '2nd', '1st'],
	},
	{
		id: 'h4',
		name: 'Szlachetny Filip',
		odds: 5.6,
		color: '#0F766E',
		history: ['3rd', '4th', '2nd', '5th', '3rd'],
	},
	{
		id: 'h5',
		name: 'Dziki Dyzek',
		odds: 6.8,
		color: '#7C3AED',
		history: ['5th', '1st', '4th', '3rd', '6th'],
	},
	{
		id: 'h6',
		name: 'Wolny Jakub',
		odds: 8.0,
		color: '#D97706',
		history: ['6th', '4th', '5th', '2nd', '3rd'],
	},
];

const phaseDurations = {
	betting: 30,
	racing: 30,
	'photo-finish': 3,
	results: 5,
};

const phaseLabels = {
	betting: 'Obstawianie',
	racing: 'Wyścig',
	'photo-finish': 'Fotofinisz',
	results: 'Wyniki',
};

const formatTime = (seconds) => {
	const minutes = Math.floor(seconds / 60);
	const remaining = seconds % 60;
	return `${minutes}:${remaining.toString().padStart(2, '0')}`;
};

const getHorseById = (id, horsesList) => horsesList.find((horse) => horse.id === id);

const resultToScore = (result) => {
	const numeric = Number(result.replace(/[^0-9]/g, ''));
	return Number.isNaN(numeric) ? 6 : clamp(numeric, 1, 6);
};

const buildSparklinePath = (history) => {
	const width = 100;
	const height = 32;
	const step = width / (history.length - 1);
	const points = history.map((result, index) => {
		const rank = resultToScore(result);
		return {
			x: index * step,
			y: ((rank - 1) / 5) * (height - 8) + 4,
		};
	});
	return points
		.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
		.join(' ');
};

const clamp = (number, min, max) => Math.min(Math.max(number, min), max);




const HorseIcon = ({ color, size = 24 }) => (
	<svg
		width={size}
		height={size}
		viewBox="-2 0 45 35"
		fill={color}
		stroke="none"
	>
		<path d="M38 8 L43 11 L40 15 L33 18 L34 22 L39 32 L35 34 L28 23 L16 23 L6 34 L2 32 L10 20 L4 14 L-2 16 L0 12 L4 10 L12 10 L24 12 L30 4 L31 0 L34 4 L37 5 Z" />
		<circle cx="37" cy="9" r="1.5" fill="white" />
		<circle cx="37.5" cy="9" r="0.8" fill="black" />
	</svg>
);

const Sparkline = ({ history }) => {
	const path = buildSparklinePath(history);
	return (
		<svg viewBox="0 0 100 32" className="sparkline-chart" aria-hidden="true">
			<defs>
				<linearGradient id="sparkline-gradient" x1="0" y1="0" x2="100" y2="0" gradientUnits="userSpaceOnUse">
					<stop offset="0%" stopColor="#7C3AED" />
					<stop offset="100%" stopColor="#38BDF8" />
				</linearGradient>
			</defs>
			<path
				d={path}
				fill="none"
				stroke="url(#sparkline-gradient)"
				strokeWidth="2"
				strokeLinecap="round"
			/>
		</svg>
	);
};

const HorseCard = ({ horse, selected, hovered, onSelect, onHover }) => {
	return (
		<button
			type="button"
			onMouseEnter={() => onHover(horse.id)}
			onMouseLeave={() => onHover(null)}
			className={`w-full rounded-lg border p-3 text-center transition-shadow ${
				selected ? 'border-amber-400 shadow-xl' : 'border-zinc-700 hover:border-white'
			}`}
			style={{
				background: '#0f172a',
			}}
			onClick={() => onSelect(horse.id)}
		>
			<div className="flex flex-col items-center justify-center gap-1">
				<div className="flex items-center gap-2">
					<HorseIcon color={horse.color} size={32} />
					<p className="text-lg font-bold text-amber-300 leading-tight">{horse.name}</p>
				</div>
				<span
					className="rounded-full px-3 py-1 text-base font-bold"
					style={{ background: horse.color, color: '#fff' }}
				>
					{horse.odds.toFixed(1)}x
				</span>
			</div>
			<div className="mt-2 flex flex-wrap items-center justify-center gap-1 text-xs text-zinc-300">
				{horse.history.map((result, index) => (
					<span key={index} className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs">
						{result}
					</span>
				))}
			</div>
			{hovered && (
				<div className="mt-3 rounded-lg bg-zinc-900/90 p-2 shadow-inner shadow-violet-500/20">
					<div className="mb-1 flex items-center justify-between text-sm text-zinc-400">
						<span>Ostatnia forma</span>
						<span className="font-semibold text-amber-300">{horse.history[0]}</span>
					</div>
					<Sparkline history={horse.history} />
				</div>
			)}
		</button>
	);
};

const PhaseBadge = ({ phase }) => (
	<div className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-base uppercase tracking-[0.3em] text-zinc-300">
		<span className="h-2 w-2 rounded-full bg-emerald-400" />
		<span>{phaseLabels[phase]}</span>
	</div>
);

const BetSlip = ({ selectedHorse, stake, setStake, onPlaceBet, potentialPayout, betPlaced, bettingError, phase }) => (
	<div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 shadow-xl">
		<h2 className="mb-4 text-2xl font-semibold text-amber-400">🎟️ Kupon Zakładu</h2>
		{betPlaced ? (
			<div className="space-y-3">
				<div className="rounded-xl bg-green-900/30 border border-green-700 p-3">
					<p className="text-sm text-green-400">✓ Zakład przyjęty na ten wyścig</p>
					<p className="text-xs text-green-300 mt-1">Nie możesz obstawić kolejnego zakładu w tej rundzie.</p>
				</div>
			</div>
		) : (
		<div className="space-y-3">
			<div className="rounded-xl bg-zinc-900 p-3">
				<p className="text-sm uppercase tracking-[0.25em] text-zinc-400">Wybrany koń</p>
				<div className="flex items-center justify-center gap-2 pt-2">
					{selectedHorse && <HorseIcon color={selectedHorse.color} size={28} />}
					<p className="text-xl font-bold text-amber-300 text-center">
						{selectedHorse ? selectedHorse.name : 'Wybierz konia'}
					</p>
				</div>
				<p className="text-sm text-zinc-400">Kurs: {selectedHorse ? selectedHorse.odds.toFixed(1) : '-'}</p>
			</div>
			<label className="block text-sm text-zinc-300 text-center">
				Stawka (punkty)
				<input
					type="number"
					min="1"
					value={stake}
					onChange={(event) => setStake(event.target.value)}
					className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-amber-300 outline-none focus:border-amber-400 text-center text-base"
					placeholder="Wpisz kwotę"
				/>
			</label>
			<div className="rounded-xl bg-zinc-900 p-3">
				<p className="text-sm uppercase tracking-[0.25em] text-zinc-400">💰 Możliwa wygrana</p>
				<p className="mt-1 text-3xl font-semibold text-emerald-300">{potentialPayout}</p>
				<p className="text-xs text-zinc-500">Zawiera prowizję kasyna</p>
			</div>
			<button
				type="button"
				onClick={onPlaceBet}
				disabled={!selectedHorse || Number(stake) <= 0 || betPlaced || phase !== 'betting'}
				className="w-full rounded-xl bg-amber-500 px-3 py-2 text-base font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
			>
				{betPlaced ? '✓ Zakład Przyjęty' : '🎯 Postaw Zakład'}
			</button>
			{bettingError && (
				<p className="mt-1 text-center text-red-500 text-sm">{bettingError}</p>
			)}
		</div>
		)}
	</div>
);

const RacePlaceholder = () => {
	return (
		<div className="space-y-6 rounded-[2rem] border border-zinc-800 bg-[#07111f] p-6 shadow-2xl text-center">
			<div className="rounded-[2rem] bg-[#111c30] p-6">
				<p className="text-base uppercase tracking-[0.35em] text-zinc-500">🏁 Tor wyścigowy</p>
				<div className="mt-6 space-y-4">
					{[...Array(6)].map((_, index) => (
						<div key={index} className="flex items-center gap-4 rounded-3xl bg-zinc-950 p-4">
							<div className="h-3 flex-1 rounded-full bg-zinc-800" />
							<div className="h-3 w-16 rounded-full bg-amber-500" />
						</div>
					))}
				</div>
			</div>
			<div className="grid gap-4 md:grid-cols-2">
				<div className="rounded-3xl bg-zinc-900 p-5 text-center">
					<p className="text-base uppercase tracking-[0.3em] text-zinc-500">Race tempo</p>
					<p className="mt-3 text-xl font-semibold text-white">Nieliniowa animacja ruchu końców</p>
				</div>
				<div className="rounded-3xl bg-zinc-900 p-5 text-center">
					<p className="text-base uppercase tracking-[0.3em] text-zinc-500">Notatka gry</p>
					<p className="mt-3 text-xl text-zinc-300">
						Silnik używa kursów do losowania zwycięzcy; wynik zostanie zapisany po zakończeniu wyścigu.
					</p>
				</div>
			</div>
		</div>
	);
};

const PhotoFinishPlaceholder = ({ winner }) => {
	return (
		<div className="rounded-[2rem] border border-zinc-800 bg-[#08121f] p-8 text-center shadow-2xl">
			<p className="text-base uppercase tracking-[0.35em] text-zinc-500">Finał</p>
			<p className="mt-4 text-4xl font-semibold text-white">{winner ? winner.name : 'Zacięta końcówka!'}</p>
			<div className="mx-auto mt-8 h-56 w-full max-w-3xl rounded-3xl bg-zinc-950 p-6">
				<p className="text-zinc-400 text-lg">Zrzut z kamery zwycięzcy i najbliższych rywali.</p>
			</div>
		</div>
	);
};

const ResultsPanel = ({ raceOutcome, betSlip, horses }) => {
	if (!raceOutcome) {
		return (
				<div className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-6 text-center text-zinc-400 text-lg">
					<p>Oczekiwanie na zakończenie wyścigu...</p>
				</div>
		);
	}

	const winner = getHorseById(raceOutcome.winnerId, horses);
	const stakeValue = Number(betSlip?.stake || 0);
	const won = betSlip && betSlip.horseId === winner?.id;

	return (
		<div className="space-y-6 rounded-[2rem] border border-zinc-800 bg-[#07111f] p-8 shadow-2xl text-center">
			<div className="rounded-3xl bg-zinc-950 p-8">
				<p className="text-base uppercase tracking-[0.35em] text-zinc-500">Wyniki wyścigu</p>
				<p className="mt-4 text-4xl font-bold text-emerald-300">🏆 {winner?.name}</p>
				<p className="mt-3 text-xl text-zinc-300">Kurs: <span className="font-bold text-amber-400">{winner?.odds.toFixed(1)}x</span></p>
			</div>
			<div className="grid gap-6 md:grid-cols-2">
				<div className="rounded-3xl bg-zinc-900 p-5">
					<p className="text-base uppercase tracking-[0.3em] text-zinc-500">Tabela wyników</p>
					<ol className="mt-4 space-y-3 text-white">
						{raceOutcome.order.map((horse, index) => (
							<li
								key={horse.id}
								className="flex items-center justify-between rounded-2xl bg-zinc-950 px-4 py-3 text-lg"
							>
								<span>
									{index + 1}. {horse.name}
								</span>
									<span className="text-zinc-400">{horse?.odds?.toFixed(1) ?? '-'}x</span>
							</li>
						))}
					</ol>
				</div>
				<div className="rounded-3xl bg-zinc-900 p-5">
					<p className="text-base uppercase tracking-[0.3em] text-zinc-500">Rozliczenie zakładu</p>
					{betSlip ? (
						<div className="mt-4 space-y-3 text-white text-lg">
							<p>Postawione: {stakeValue.toFixed(2)} punktów</p>
							<p>Wybrany koń: {getHorseById(betSlip.horseId, horses)?.name}</p>
							<p>Wynik: {won ? 'Wygrana' : 'Przegrana'}</p>
							<p className="text-2xl font-semibold text-emerald-300">
								{won ? `Wypłata: ${raceOutcome.payout.toFixed(2)} punktów` : 'Brak wypłaty'}
							</p>
						</div>
					) : (
						<p className="mt-4 text-zinc-400 text-lg">Brak zakładu w tej rundzie.</p>
					)}
				</div>
			</div>
		</div>
	);
};

const ProgressTracker = ({ phase, horses, sharedProgressRef }) => {
	const [positions, setPositions] = useState([]);

	useEffect(() => {
		if (phase === 'betting' || phase === 'results') {
			setPositions(horses.map((h) => ({ horse: h, progress: 0 })));
		}
	}, [phase, horses]);

	useEffect(() => {
		if (phase !== 'racing' && phase !== 'photo-finish') return;

		let rafId;
		const tick = () => {
			const newPositions = horses.map((horse) => {
				const progress = sharedProgressRef.current[horse.id] || 0;
				return { horse, progress };
			});
			
			setPositions(newPositions);
			rafId = requestAnimationFrame(tick);
		};

		rafId = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(rafId);
	}, [phase, horses, sharedProgressRef]);

	return (
		<div className="progress-tracker rounded-[2rem] border border-zinc-800 bg-[#020617]/80 p-4 shadow-2xl text-center">
			<div className="mb-3 flex items-center justify-between text-base text-zinc-400">
				<span>Przegląd toru na żywo</span>
				<span>{horses.length} koni</span>
			</div>
			<div className="relative h-4 overflow-hidden rounded-full bg-zinc-900/50">
				<div className="absolute inset-y-0 left-0 w-full rounded-full bg-gradient-to-r from-amber-500/30 via-fuchsia-500/20 to-sky-500/10" />
				{positions.map((item) => (
					<div
						key={item.horse.id}
						className="progress-dot absolute -translate-x-1/2 -translate-y-0 top-1/2 rounded-full border border-white/20 bg-white text-xs text-zinc-950"
						style={{ left: `${Math.min(item.progress * 100, 100)}%`, width: '16px', height: '16px' }}
						title={`${item.horse.name}`}
					>
						<span className="absolute inset-0 flex items-center justify-center font-semibold text-xs text-slate-950">
							{item.horse.id.replace('h', '')}
						</span>
					</div>
				))}
			</div>
		</div>
	);
};

const ConfettiOverlay = ({ active, amount }) => {
	const particles = Array.from({ length: 22 }, (_, index) => ({
		id: index,
		left: Math.random() * 100,
		delay: Math.random() * 1,
		duration: 1.5 + Math.random() * 1.2,
		color: ['#FACC15', '#38BDF8', '#A78BFA', '#6EE7B7', '#F47174'][index % 5],
		size: 6 + Math.random() * 6,
	}));
	if (!active) return null;
	return (
		<div className="confetti-overlay pointer-events-none">
			{particles.map((piece) => (
				<span
					key={piece.id}
					className="confetti-piece"
					style={{
						left: `${piece.left}%`,
						width: `${piece.size}px`,
						height: `${piece.size * 1.8}px`,
						background: piece.color,
						animationDelay: `${piece.delay}s`,
						animationDuration: `${piece.duration}s`,
					}}
				/>
			))}
			<div className="confetti-message">
				<span className="confetti-text text-3xl font-bold">+{amount.toFixed(2)} Credits</span>
			</div>
		</div>
	);
};

const HorseRacing = ({ user, syncPoints }) => {
  const [horses, setHorses] = useState(defaultHorses);
  const [phase, setPhase] = useState('betting');
  const [timer, setTimer] = useState(phaseDurations.betting);
  const [selectedHorseId, setSelectedHorseId] = useState(null);
	const [stake, setStake] = useState('25');
	const [betSlip, setBetSlip] = useState(null);
	const [raceOutcome, setRaceOutcome] = useState(null);
	const [hoveredHorseId, setHoveredHorseId] = useState(null);
	const [confettiActive, setConfettiActive] = useState(false);
	const [winningAmount, setWinningAmount] = useState(0);
	const [raceNumber, setRaceNumber] = useState(0);
	const [bettingError, setBettingError] = useState(null); 
	const sharedProgressRef = useRef({});

	const selectedHorse = useMemo(() => getHorseById(selectedHorseId, horses), [selectedHorseId, horses]);

	const potentialPayout = useMemo(() => {
		const value = Number(stake || 0);
		if (!selectedHorse || value <= 0) return '0.00';
		const raw = value * selectedHorse.odds;
		const adjusted = raw * 0.94;
		return adjusted.toFixed(2);
	}, [selectedHorse, stake]);

	useEffect(() => {
		const won = raceOutcome && betSlip && raceOutcome.winnerId === betSlip.horseId;
		if (phase === 'results' && won) {
			setWinningAmount(raceOutcome.payout);
			setConfettiActive(true);
			const timerId = window.setTimeout(() => {
				setConfettiActive(false);
			}, 4200);
			return () => window.clearTimeout(timerId);
		}
		setConfettiActive(false);
		return undefined;
	}, [phase, raceOutcome, betSlip]);

	const elapsedRaceTime = useMemo(() => {
		if (phase === 'racing') return phaseDurations.racing - timer;
		if (phase === 'photo-finish') return 27.0; // Moment przecięcia mety przez zwycięzcę
		if (phase === 'results') return 30.0;
		return 0;
	}, [phase, timer]);

	const syncPointsRef = useRef(syncPoints);
	useEffect(() => {
		syncPointsRef.current = syncPoints;
	}, [syncPoints]);

	useEffect(() => {
		const fetchRaceState = async () => {
			try {
				
				const username = user?.username; 
				if (!username) return;
				const response = await fetch(`http://localhost:8080/api/horse-race/current?username=${username}`);
				if (!response.ok) {
					throw new Error(`Failed to fetch race state: ${response.statusText}`);
				}
			const data = await response.json();

			
			setPhase(data.raceState.phase);
			setTimer(data.raceState.timer);
			setRaceNumber(data.raceState.raceNumber);
				const raceHorses = data.raceState.horses || defaultHorses;
				if (data.raceState.horses) {
					setHorses(data.raceState.horses);
				}

			
			if (data.raceState.userBalance !== undefined) {
				syncPointsRef.current(data.raceState.userBalance);
			}

			if (data.raceState.userBet) {
				const serverBet = {
					horseId: data.raceState.userBet.horseId,
					stake: Number(data.raceState.userBet.stake),
					odds: Number(data.raceState.userBet.odds),
				};
				setBetSlip(serverBet);
				setSelectedHorseId(serverBet.horseId);
				setStake(String(serverBet.stake));
				setBettingError(null);
				try {
					localStorage.setItem('currentBetSlip', JSON.stringify({
						...serverBet,
						raceNumber: data.raceState.raceNumber,
						username,
					}));
				} catch (e) {
					console.error('Failed to save bet slip to local storage', e);
				}
			} else if (data.raceState.phase === 'betting') {
				setBetSlip(null);
				localStorage.removeItem('currentBetSlip');
			}

			if (data.raceState.outcome) {
					setRaceOutcome({
						winnerId: data.raceState.outcome.winnerId,
						order: getRaceOrder(data.raceState.outcome.winnerId, raceHorses),
						payout: data.raceState.outcome.payout,
					});
				} else if (data.raceState.phase === 'betting' && data.raceState.raceNumber !== raceNumber) {
					
					setRaceOutcome(null);
				}

			} catch (error) {
				console.error('Error fetching race state:', error);
				
			}
		};

		
		fetchRaceState();
		const intervalId = setInterval(fetchRaceState, 1000);

		return () => clearInterval(intervalId);
	}, [raceNumber, user?.username]); 

	const handlePlaceBet = async () => {
		
		if (Boolean(betSlip)) {
			return;
		}

		if (!selectedHorse || Number(stake) <= 0) return;

		if (phase !== 'betting') {
			setBettingError('Zakłady można stawiać tylko w fazie obstawiania.');
			return;
		}

		setBettingError(null); 
		console.log('Placing bet for:', selectedHorse);
		console.log('Stake:', stake);
		console.log('Odds:', selectedHorse?.odds);

		try {
			const response = await fetch(`http://localhost:8080/api/horse-race/current/bet`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					username: user?.username,
					horseId: selectedHorse.id,
					stake: Number(stake),
					odds: selectedHorse.odds,
				}),
			});

			if (!response.ok) {
				let errorData = {};
				try {
					errorData = await response.json();
				} catch {
					errorData = {};
				}
				let errorMessage = errorData.error || 'Nie udało się postawić zakładu.';

				
				
				if (betSlip && errorMessage === 'You already have a bet placed on this race') {
					return; 
				}

				if (errorMessage === 'You already have a bet placed on this race') {
					errorMessage = 'Masz już postawiony zakład na ten wyścig.';
				} else if (errorMessage === 'Betting is only allowed during the betting phase') {
					errorMessage = 'Zakłady można stawiać tylko w fazie obstawiania.';
				} else if (errorMessage === 'User not found') {
					errorMessage = 'Nie znaleziono użytkownika.';
				} else if (errorMessage === 'Missing required fields: username, horseId, stake, odds') {
					errorMessage = 'Brakuje wymaganych danych zakładu.';
				} else if (errorMessage === 'Server error' || errorMessage === 'Failed to place bet') {
					errorMessage = 'Nie udało się postawić zakładu.';
				}
				setBettingError(errorMessage);
				return;
			}
			const data = await response.json();

				
			const currentBet = data.betSlip || {
				horseId: selectedHorse.id,
				stake: Number(stake),
				odds: selectedHorse.odds,
			};
			setBetSlip(currentBet);
			syncPointsRef.current(data.userBalance); 
			try {
				localStorage.setItem('currentBetSlip', JSON.stringify({
					...currentBet,
					raceNumber,
					username: user?.username,
				}));
			} catch (e) {
				console.error('Failed to save bet slip to local storage', e);
			}
		} catch (error) {
			console.error('Error placing bet:', error);
			setBettingError('Nie udało się połączyć z serwerem zakładów.');
		}
	};

	if (!phase) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-slate-950 text-amber-300">
				<p className="text-2xl font-bold animate-pulse">Łączenie z serwerem wyścigów...</p>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen flex-col items-start justify-start bg-slate-950 px-4 py-2 text-white font-sans text-center">
			<div className="mx-auto w-full max-w-[1400px] space-y-4">
				<ConfettiOverlay active={confettiActive} amount={winningAmount} />
			<header className="rounded-[2rem] border border-zinc-800 bg-[#020617] p-4 shadow-2xl">
				<div className="flex flex-col gap-4 items-center">
					<div className="w-full text-center">
						<h2 style={{ 
							fontSize: '2.5rem', 
							marginBottom: '25px', 
							letterSpacing: '4px',
							textTransform: 'uppercase', 
							fontFamily: '"Arial Black", "Montserrat", "Impact", sans-serif',
							fontWeight: '900',
							color: '#fdd835', 
							textShadow: '0 0 10px rgba(253, 216, 53, 0.6), 0 0 25px rgba(253, 216, 53, 0.4), 0 0 40px rgba(253, 216, 53, 0.2)'
						}}>
							WYŚCIGI KONNE
						</h2>
						<p className="mt-1 max-w-2xl mx-auto text-base md:text-lg text-amber-400">
									Obstaw wyścig #{raceNumber}. Obserwuj przebieg wyścigu w tle i przygotuj kolejny zakład.
							</p>
						</div>
						<div className="mx-auto flex w-full flex-wrap items-center justify-center gap-4">
							<div className="rounded-full bg-zinc-900 px-6 py-2 text-lg font-bold uppercase tracking-wider text-zinc-300 text-center">
								🏁 Wyścig #{raceNumber} • {phaseLabels[phase]}
							</div>
							<div className="rounded-3xl bg-amber-600/20 border border-amber-500 px-6 py-2 text-4xl font-extrabold text-amber-300 text-center">
								⏱️ {formatTime(timer)}
							</div>
						</div>
					</div>
				</header>

				<div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
					<section className="space-y-4">
						{phase === 'betting' && (
							<div className="grid gap-4 lg:grid-cols-2 justify-items-center">
								{horses.map((horse) => (
									<HorseCard
										key={horse.id}
										horse={horse}
										selected={horse.id === selectedHorseId}
										hovered={horse.id === hoveredHorseId}
										onHover={setHoveredHorseId}
										onSelect={setSelectedHorseId}
									/>
								))}
							</div>
						)}

						{(phase === 'racing' || phase === 'photo-finish') && (
							<div
								className={`relative rounded-[2rem] border border-zinc-800 bg-slate-950 p-2 shadow-2xl ${phase === 'photo-finish' ? 'photo-finish-canvas' : ''
								}`}
							>
								<RaceTrack
									gameState={phase}
									horses={horses}
									winnerId={raceOutcome?.winnerId || selectedHorseId || 'h1'}
									initialElapsed={elapsedRaceTime}
									raceOutcome={raceOutcome} raceNumber={raceNumber} 
									sharedProgressRef={sharedProgressRef}
								/>
								{phase === 'photo-finish' && (
										<div className="photo-finish-banner absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center">
											<span className="photo-finish-text text-3xl md:text-4xl font-extrabold text-white">Koniec</span>
										</div>
								)}
							</div>
						)}
						{phase === 'results' && <ResultsPanel raceOutcome={raceOutcome} raceNumber={raceNumber} betSlip={betSlip} horses={horses} />}
						<ProgressTracker 
							phase={phase} 
							horses={horses} 
							sharedProgressRef={sharedProgressRef}
						/>
					</section>

					<aside className="space-y-4">
						<BetSlip
							selectedHorse={selectedHorse}
							stake={stake}
							setStake={setStake}
							onPlaceBet={handlePlaceBet}
							potentialPayout={potentialPayout}
							betPlaced={Boolean(betSlip)}
							bettingError={bettingError}
							phase={phase} 
						/>

						<div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 shadow-xl">
							<h2 className="mb-4 text-2xl font-bold text-white text-center">Forma koni</h2>
							<ul className="space-y-3 text-zinc-300">
								{horses.map((horse) => (
									<li key={horse.id} className="rounded-xl bg-zinc-900 px-4 py-2 text-center">
										<div className="flex items-center justify-center gap-2">
											<span className="text-lg font-semibold">{horse.name}</span>
											<span className="text-sm text-zinc-400">{horse.odds.toFixed(1)}x</span>
										</div>
										<div className="mt-2 flex flex-wrap items-center justify-center gap-1 text-xs">
											{horse.history.map((result, idx) => (
												<span key={idx} className="rounded-full bg-zinc-800 px-2 py-0.5">
													{result}
												</span>
											))}
										</div>
									</li>
								))}
							</ul>
						</div>
					</aside>
				</div>
			</div>
		</div>
	);
};

export default HorseRacing;
