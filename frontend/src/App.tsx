import { useEffect, useMemo, useState } from "react";
import "./App.css";

type Tab =
  | "tap"
  | "upgrades"
  | "bonus"
  | "friends"
  | "top"
  | "wallet"
  | "settings";

const STARTING_COINS = 0;
const STARTING_ENERGY = 1000;
const ENERGY_REGEN_PER_SECOND = 1;
const ENERGY_AD_RESTORE = 1000;

const COINS_KEY = "haveny_coins";
const ENERGY_KEY = "haveny_energy";
const MAX_ENERGY_KEY = "haveny_max_energy";
const TAP_POWER_KEY = "haveny_tap_power";
const PASSIVE_KEY = "haveny_passive";
const DAILY_KEY = "haveny_daily_claim";

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("tap");

  const [coins, setCoins] = useState<number>(() => {
    return Number(localStorage.getItem(COINS_KEY)) || STARTING_COINS;
  });

  const [energy, setEnergy] = useState<number>(() => {
    const saved = localStorage.getItem(ENERGY_KEY);
    return saved === null ? STARTING_ENERGY : Number(saved);
  });

  const [maxEnergy, setMaxEnergy] = useState<number>(() => {
    return Number(localStorage.getItem(MAX_ENERGY_KEY)) || STARTING_ENERGY;
  });

  const [tapPower, setTapPower] = useState<number>(() => {
    return Number(localStorage.getItem(TAP_POWER_KEY)) || 1;
  });

  const [passiveIncome, setPassiveIncome] = useState<number>(() => {
    return Number(localStorage.getItem(PASSIVE_KEY)) || 0;
  });

  const [dailyClaimed, setDailyClaimed] = useState<boolean>(() => {
    return localStorage.getItem(DAILY_KEY) === new Date().toDateString();
  });

  const [dailyAdClaimed, setDailyAdClaimed] = useState(false);
  const [profitBoostActive, setProfitBoostActive] = useState(false);
  const [missionOneClaimed, setMissionOneClaimed] = useState(false);
  const [missionTwoClaimed, setMissionTwoClaimed] = useState(false);

  const [floatingCoins, setFloatingCoins] = useState<
    { id: number; amount: number; x: number; y: number }[]
  >([]);

  const [isCreatureActive, setIsCreatureActive] = useState(false);
  const [message, setMessage] = useState("");

  const energyPercent = useMemo(() => {
    return Math.max(0, Math.min(100, (energy / maxEnergy) * 100));
  }, [energy, maxEnergy]);

  const formattedCoins = Math.floor(coins).toLocaleString();

  useEffect(() => {
    localStorage.setItem(COINS_KEY, String(coins));
  }, [coins]);

  useEffect(() => {
    localStorage.setItem(ENERGY_KEY, String(energy));
  }, [energy]);

  useEffect(() => {
    localStorage.setItem(MAX_ENERGY_KEY, String(maxEnergy));
  }, [maxEnergy]);

  useEffect(() => {
    localStorage.setItem(TAP_POWER_KEY, String(tapPower));
  }, [tapPower]);

  useEffect(() => {
    localStorage.setItem(PASSIVE_KEY, String(passiveIncome));
  }, [passiveIncome]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setEnergy((current) => {
        if (current >= maxEnergy) {
          return maxEnergy;
        }

        return Math.min(
          maxEnergy,
          current + ENERGY_REGEN_PER_SECOND
        );
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [maxEnergy]);

  useEffect(() => {
    if (passiveIncome <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      const multiplier = profitBoostActive ? 2 : 1;

      setCoins(
        (current) =>
          current + (passiveIncome * multiplier) / 3600
      );
    }, 1000);

    return () => window.clearInterval(timer);
  }, [passiveIncome, profitBoostActive]);

  useEffect(() => {
    if (!message) {
      return;
    }

    const timer = window.setTimeout(() => {
      setMessage("");
    }, 2200);

    return () => window.clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    if (!profitBoostActive) {
      return;
    }

    const timer = window.setTimeout(() => {
      setProfitBoostActive(false);
      setMessage("2× Profit boost ended.");
    }, 15 * 60 * 1000);

    return () => window.clearTimeout(timer);
  }, [profitBoostActive]);

  const handleTap = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    if (energy <= 0) {
      setMessage("Energy empty — wait or watch an ad.");
      return;
    }

    setCoins((current) => current + tapPower);
    setEnergy((current) => Math.max(0, current - 1));

    const rect = event.currentTarget.getBoundingClientRect();

    const newFloatingCoin = {
      id: Date.now() + Math.random(),
      amount: tapPower,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };

    setFloatingCoins((current) => [
      ...current,
      newFloatingCoin,
    ]);

    setIsCreatureActive(true);

    window.setTimeout(() => {
      setFloatingCoins((current) =>
        current.filter(
          (item) => item.id !== newFloatingCoin.id
        )
      );
    }, 800);

    window.setTimeout(() => {
      setIsCreatureActive(false);
    }, 180);
  };

  const watchEnergyAd = () => {
    setEnergy((current) =>
      Math.min(maxEnergy, current + ENERGY_AD_RESTORE)
    );

    setMessage(
      `+${ENERGY_AD_RESTORE.toLocaleString()} Energy restored!`
    );
  };

  const watchDailyAd = () => {
    if (dailyAdClaimed) {
      setMessage("Daily ad reward already claimed.");
      return;
    }

    setCoins((current) => current + 5000);
    setDailyAdClaimed(true);
    setMessage("+5,000 coins from the rewarded ad!");
  };

  const watchProfitAd = () => {
    if (profitBoostActive) {
      setMessage("2× Profit boost is already active.");
      return;
    }

    setProfitBoostActive(true);
    setMessage("2× Profit activated for 15 minutes!");
  };

  const watchMissionAd = (
    mission: "tap" | "haven"
  ) => {
    if (mission === "tap") {
      if (missionOneClaimed) {
        setMessage("This mission reward is already claimed.");
        return;
      }

      setCoins((current) => current + 2000);
      setMissionOneClaimed(true);
      setMessage("+2,000 coins mission reward!");
      return;
    }

    if (missionTwoClaimed) {
      setMessage("This mission reward is already claimed.");
      return;
    }

    setCoins((current) => current + 5000);
    setMissionTwoClaimed(true);
    setMessage("+5,000 coins mission reward!");
  };

  const upgradeTapPower = () => {
    const cost = Math.floor(
      100 * Math.pow(1.8, tapPower - 1)
    );

    if (coins < cost) {
      setMessage("Not enough coins.");
      return;
    }

    setCoins((current) => current - cost);
    setTapPower((current) => current + 1);
    setMessage("Tap Power upgraded!");
  };

  const upgradeEnergy = () => {
    const level = Math.max(
      0,
      (maxEnergy - 1000) / 500
    );

    const cost = Math.floor(
      250 * Math.pow(1.7, level)
    );

    if (coins < cost) {
      setMessage("Not enough coins.");
      return;
    }

    setCoins((current) => current - cost);
    setMaxEnergy((current) => current + 500);
    setEnergy((current) =>
      Math.min(current + 500, maxEnergy + 500)
    );
    setMessage("Energy capacity increased!");
  };

  const buyPassiveGenerator = (
    name: string,
    income: number,
    cost: number
  ) => {
    if (coins < cost) {
      setMessage("Not enough coins.");
      return;
    }

    setCoins((current) => current - cost);
    setPassiveIncome((current) => current + income);
    setMessage(`${name} activated!`);
  };

  const claimDaily = () => {
    if (dailyClaimed) {
      setMessage("Daily reward already claimed.");
      return;
    }

    setCoins((current) => current + 5000);
    setDailyClaimed(true);
    localStorage.setItem(
      DAILY_KEY,
      new Date().toDateString()
    );
    setMessage("+5,000 coins claimed!");
  };

  const renderTapScreen = () => (
    <div className="screen tap-screen">
      <div className="profile-row">
        <div className="avatar">🧙</div>

        <div className="profile-info">
          <strong>Haveny Player</strong>
          <span>Forest Wanderer</span>
        </div>

        <div className="rank-badge">#128</div>
      </div>

      <div className="balance-card">
        <span className="balance-label">
          YOUR BALANCE
        </span>

        <strong className="coin-balance">
          🪙 {formattedCoins}
        </strong>

        <div className="income-row">
          <span>Tap Power: +{tapPower}</span>
          <span>
            Passive: +{passiveIncome}/hr
          </span>
        </div>

        {profitBoostActive && (
          <div className="boost-active">
            🚀 2× Profit Active
          </div>
        )}
      </div>

      <div className="creature-area">
        <div className="creature-glow" />

        <button
          className={`creature-button ${
            isCreatureActive
              ? "creature-active"
              : ""
          }`}
          onClick={handleTap}
          aria-label="Tap creature"
        >
          <div className="creature">
            <div className="ear ear-left" />
            <div className="ear ear-right" />

            <div className="head">
              <div className="eye eye-left" />
              <div className="eye eye-right" />

              <div className="face-mark face-mark-left" />
              <div className="face-mark face-mark-right" />

              <div className="nose" />
              <div className="mouth" />
            </div>

            <div className="body">
              <div className="belly" />
              <div className="arm arm-left" />
              <div className="arm arm-right" />
            </div>

            <div className="leg leg-left" />
            <div className="leg leg-right" />
          </div>
        </button>

        {floatingCoins.map((item) => (
          <span
            className="floating-coin"
            key={item.id}
            style={{
              left: item.x,
              top: item.y,
            }}
          >
            +{item.amount}
          </span>
        ))}
      </div>

      <div className="energy-section">
        <div className="energy-header">
          <span>⚡ Energy</span>

          <strong>
            {Math.floor(energy).toLocaleString()} /{" "}
            {maxEnergy.toLocaleString()}
          </strong>
        </div>

        <div className="energy-track">
          <div
            className="energy-fill"
            style={{
              width: `${energyPercent}%`,
            }}
          />
        </div>

        <div className="energy-footer">
          <span>+1 energy / sec</span>

          <button
            className="ad-button"
            onClick={watchEnergyAd}
          >
            ▶ Watch Ad +1,000
          </button>
        </div>
      </div>

      {message && <div className="toast">{message}</div>}
    </div>
  );

  const renderUpgradesScreen = () => {
    const tapCost = Math.floor(
      100 * Math.pow(1.8, tapPower - 1)
    );

    const energyLevel = Math.max(
      0,
      (maxEnergy - 1000) / 500
    );

    const energyCost = Math.floor(
      250 * Math.pow(1.7, energyLevel)
    );

    return (
      <div className="screen">
        <div className="page-title">
          <span>✨</span>

          <div>
            <h1>Upgrades</h1>
            <p>Grow your Haven faster</p>
          </div>
        </div>

        <div className="upgrade-card">
          <div className="upgrade-icon">👆</div>

          <div className="upgrade-info">
            <h3>Tap Power</h3>
            <p>
              Current: +{tapPower} coin per tap
            </p>
            <small>
              Next level: +{tapPower + 1}
            </small>
          </div>

          <button
            className="upgrade-button"
            onClick={upgradeTapPower}
            disabled={coins < tapCost}
          >
            🪙 {tapCost.toLocaleString()}
          </button>
        </div>

        <div className="upgrade-card">
          <div className="upgrade-icon">⚡</div>

          <div className="upgrade-info">
            <h3>Energy Capacity</h3>
            <p>
              Maximum: {maxEnergy.toLocaleString()}
            </p>
            <small>
              Next:{" "}
              {(maxEnergy + 500).toLocaleString()}
            </small>
          </div>

          <button
            className="upgrade-button"
            onClick={upgradeEnergy}
            disabled={coins < energyCost}
          >
            🪙 {energyCost.toLocaleString()}
          </button>
        </div>

        <h2 className="section-heading">
          Passive Generators
        </h2>

        <div className="generator-grid">
          <GeneratorCard
            icon="🫐"
            name="Forest Berries"
            income={25}
            cost={1000}
            coins={coins}
            onBuy={buyPassiveGenerator}
          />

          <GeneratorCard
            icon="🌳"
            name="Mystic Grove"
            income={100}
            cost={5000}
            coins={coins}
            onBuy={buyPassiveGenerator}
          />

          <GeneratorCard
            icon="💎"
            name="Crystal Garden"
            income={350}
            cost={18000}
            coins={coins}
            onBuy={buyPassiveGenerator}
          />

          <GeneratorCard
            icon="🏛️"
            name="Ancient Temple"
            income={1200}
            cost={60000}
            coins={coins}
            onBuy={buyPassiveGenerator}
          />
        </div>

        <div className="ad-reward-card">
          <div>
            <span className="ad-card-icon">
              🚀
            </span>

            <div>
              <h3>2× Profit Boost</h3>
              <p>
                Double your passive income for
                15 minutes.
              </p>
            </div>
          </div>

          <button
            className="ad-button"
            onClick={watchProfitAd}
            disabled={profitBoostActive}
          >
            {profitBoostActive
              ? "Active"
              : "▶ Watch Ad"}
          </button>
        </div>

        {message && <div className="toast">{message}</div>}
      </div>
    );
  };

  const renderBonusScreen = () => (
    <div className="screen">
      <div className="page-title">
        <span>🎁</span>

        <div>
          <h1>Bonus</h1>
          <p>
            Come back every day for rewards
          </p>
        </div>
      </div>

      <div className="daily-card">
        <div className="daily-icon">🎁</div>

        <div>
          <span className="small-label">
            DAILY REWARD
          </span>

          <h2>5,000 Coins</h2>

          <p>
            Keep your daily streak alive.
          </p>
        </div>

        <button
          className="claim-button"
          onClick={claimDaily}
          disabled={dailyClaimed}
        >
          {dailyClaimed ? "Claimed" : "Claim"}
        </button>
      </div>

      <div className="ad-reward-card bonus-ad-card">
        <div>
          <span className="ad-card-icon">
            📺
          </span>

          <div>
            <h3>Daily Ad Bonus</h3>

            <p>
              Watch a rewarded ad for another
              5,000 coins.
            </p>
          </div>
        </div>

        <button
          className="ad-button"
          onClick={watchDailyAd}
          disabled={dailyAdClaimed}
        >
          {dailyAdClaimed
            ? "Claimed"
            : "▶ Watch Ad"}
        </button>
      </div>

      <div className="ad-reward-card bonus-ad-card">
        <div>
          <span className="ad-card-icon">
            🚀
          </span>

          <div>
            <h3>2× Profit</h3>

            <p>
              Watch an ad to double passive
              profit for 15 minutes.
            </p>
          </div>
        </div>

        <button
          className="ad-button"
          onClick={watchProfitAd}
          disabled={profitBoostActive}
        >
          {profitBoostActive
            ? "Active"
            : "▶ Watch Ad"}
        </button>
      </div>

      <div className="mission-card">
        <div className="mission-icon">⚡</div>

        <div className="mission-info">
          <h3>Tap Master</h3>

          <p>
            Keep tapping to grow your Haven.
          </p>

          <div className="mission-progress">
            <div style={{ width: "35%" }} />
          </div>

          <small>350 / 1,000 taps</small>
        </div>

        <button
          className="mission-ad-button"
          onClick={() =>
            watchMissionAd("tap")
          }
          disabled={missionOneClaimed}
        >
          {missionOneClaimed
            ? "Claimed"
            : "▶ Ad +2K"}
        </button>
      </div>

      <div className="mission-card">
        <div className="mission-icon">🌱</div>

        <div className="mission-info">
          <h3>Build Your Haven</h3>

          <p>
            Purchase your first passive
            generator.
          </p>

          <div className="mission-progress">
            <div
              style={{
                width:
                  passiveIncome > 0
                    ? "100%"
                    : "0%",
              }}
            />
          </div>

          <small>
            {passiveIncome > 0
              ? "Completed"
              : "0 / 1"}
          </small>
        </div>

        <button
          className="mission-ad-button"
          onClick={() =>
            watchMissionAd("haven")
          }
          disabled={
            passiveIncome <= 0 ||
            missionTwoClaimed
          }
        >
          {missionTwoClaimed
            ? "Claimed"
            : "▶ Ad +5K"}
        </button>
      </div>

      {message && <div className="toast">{message}</div>}
    </div>
  );

  const renderFriendsScreen = () => (
    <div className="screen">
      <div className="page-title">
        <span>👥</span>

        <div>
          <h1>Friends</h1>
          <p>
            Invite friends and grow together
          </p>
        </div>
      </div>

      <div className="referral-hero">
        <div className="referral-art">
          🧚‍♀️
        </div>

        <h2>
          Bring your friends to Haveny
        </h2>

        <p>
          Invite friends and unlock
          additional rewards as your
          community grows.
        </p>

        <button
          className="primary-button"
          onClick={() =>
            setMessage(
              "Referral link copied!"
            )
          }
        >
          🔗 Invite Friends
        </button>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <strong>0</strong>
          <span>Friends</span>
        </div>

        <div className="stat-card">
          <strong>0</strong>
          <span>Rewards</span>
        </div>

        <div className="stat-card">
          <strong>0</strong>
          <span>Active</span>
        </div>
      </div>

      {message && <div className="toast">{message}</div>}
    </div>
  );

  const renderTopScreen = () => (
    <div className="screen">
      <div className="page-title">
        <span>🏆</span>

        <div>
          <h1>Top Players</h1>
          <p>Haveny leaderboard</p>
        </div>
      </div>

      <div className="leaderboard">
        <LeaderboardRow
          rank={1}
          avatar="👑"
          name="MysticFox"
          coins="2.4M"
        />

        <LeaderboardRow
          rank={2}
          avatar="🧙"
          name="ForestKing"
          coins="1.9M"
        />

        <LeaderboardRow
          rank={3}
          avatar="🦊"
          name="MoonHaven"
          coins="1.5M"
        />

        <LeaderboardRow
          rank={4}
          avatar="🐉"
          name="DragonSoul"
          coins="980K"
        />

        <LeaderboardRow
          rank={5}
          avatar="🧚"
          name="MagicLeaf"
          coins="820K"
        />

        <div className="your-rank">
          <div className="rank-number">128</div>

          <div className="leader-avatar">
            🧙
          </div>

          <div className="leader-info">
            <strong>You</strong>
            <span>Current position</span>
          </div>

          <strong>{formattedCoins}</strong>
        </div>
      </div>
    </div>
  );

  const renderWalletScreen = () => (
    <div className="screen">
      <div className="page-title">
        <span>💎</span>

        <div>
          <h1>Wallet</h1>
          <p>Your Haveny rewards</p>
        </div>
      </div>

      <div className="wallet-card">
        <span className="wallet-label">
          AVAILABLE BALANCE
        </span>

        <strong>{formattedCoins}</strong>

        <span className="wallet-currency">
          HAVENY COINS
        </span>
      </div>

      <div className="wallet-info-card">
        <div>
          <span>Eligible withdrawal</span>
          <strong>0</strong>
        </div>

        <div>
          <span>Withdrawal currency</span>
          <strong>USDT / TON</strong>
        </div>
      </div>

      <button
        className="withdraw-button"
        onClick={() =>
          setMessage(
            "Withdrawal becomes available after eligibility is met."
          )
        }
      >
        Withdraw
      </button>

      <div className="secure-note">
        🔒 Withdrawals will use secure
        server-side validation.
      </div>

      {message && <div className="toast">{message}</div>}
    </div>
  );

  const renderSettingsScreen = () => (
    <div className="screen">
      <div className="page-title">
        <span>⚙️</span>

        <div>
          <h1>Settings</h1>
          <p>
            Customize your Haveny experience
          </p>
        </div>
      </div>

      <div className="settings-card">
        <SettingRow
          icon="🌐"
          title="Language"
          value="English"
        />

        <SettingRow
          icon="🎵"
          title="Music"
          value="On"
        />

        <SettingRow
          icon="🔊"
          title="Sound"
          value="On"
        />

        <SettingRow
          icon="ℹ️"
          title="About Haveny"
          value="v1.0"
        />

        <SettingRow
          icon="💬"
          title="Support"
          value="Help Center"
        />

        <SettingRow
          icon="📄"
          title="Terms"
          value="View"
        />

        <SettingRow
          icon="🔐"
          title="Privacy"
          value="View"
        />
      </div>
    </div>
  );

  return (
    <main className="app">
      <div className="background-orb orb-one" />
      <div className="background-orb orb-two" />

      <header className="top-header">
        <div className="brand">
          <div className="brand-icon">🌿</div>

          <div>
            <strong>Haveny</strong>
            <span>Fantasy World</span>
          </div>
        </div>

        <div className="header-coins">
          🪙 {formattedCoins}
        </div>
      </header>

      <section className="content">
        {activeTab === "tap" &&
          renderTapScreen()}

        {activeTab === "upgrades" &&
          renderUpgradesScreen()}

        {activeTab === "bonus" &&
          renderBonusScreen()}

        {activeTab === "friends" &&
          renderFriendsScreen()}

        {activeTab === "top" &&
          renderTopScreen()}

        {activeTab === "wallet" &&
          renderWalletScreen()}

        {activeTab === "settings" &&
          renderSettingsScreen()}
      </section>

      <nav className="bottom-nav">
        <NavButton
          icon="⚡"
          label="Tap"
          active={activeTab === "tap"}
          onClick={() => setActiveTab("tap")}
        />

        <NavButton
          icon="✨"
          label="Upgrade"
          active={activeTab === "upgrades"}
          onClick={() =>
            setActiveTab("upgrades")
          }
        />

        <NavButton
          icon="🎁"
          label="Bonus"
          active={activeTab === "bonus"}
          onClick={() =>
            setActiveTab("bonus")
          }
        />

        <NavButton
          icon="👥"
          label="Friends"
          active={activeTab === "friends"}
          onClick={() =>
            setActiveTab("friends")
          }
        />

        <NavButton
          icon="🏆"
          label="Top"
          active={activeTab === "top"}
          onClick={() => setActiveTab("top")}
        />

        <NavButton
          icon="💎"
          label="Wallet"
          active={activeTab === "wallet"}
          onClick={() =>
            setActiveTab("wallet")
          }
        />

        <NavButton
          icon="⚙️"
          label="Settings"
          active={activeTab === "settings"}
          onClick={() =>
            setActiveTab("settings")
          }
        />
      </nav>
    </main>
  );
}

function NavButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`nav-button ${
        active ? "nav-active" : ""
      }`}
      onClick={onClick}
    >
      <span>{icon}</span>
      <small>{label}</small>
    </button>
  );
}

function GeneratorCard({
  icon,
  name,
  income,
  cost,
  coins,
  onBuy,
}: {
  icon: string;
  name: string;
  income: number;
  cost: number;
  coins: number;
  onBuy: (
    name: string,
    income: number,
    cost: number
  ) => void;
}) {
  return (
    <div className="generator-card">
      <div className="generator-icon">
        {icon}
      </div>

      <h3>{name}</h3>

      <p>
        +{income.toLocaleString()} coins/hr
      </p>

      <button
        onClick={() =>
          onBuy(name, income, cost)
        }
        disabled={coins < cost}
      >
        🪙 {cost.toLocaleString()}
      </button>
    </div>
  );
}

function LeaderboardRow({
  rank,
  avatar,
  name,
  coins,
}: {
  rank: number;
  avatar: string;
  name: string;
  coins: string;
}) {
  return (
    <div className="leader-row">
      <div className="rank-number">{rank}</div>

      <div className="leader-avatar">
        {avatar}
      </div>

      <div className="leader-info">
        <strong>{name}</strong>
        <span>Haven Explorer</span>
      </div>

      <strong>{coins}</strong>
    </div>
  );
}

function SettingRow({
  icon,
  title,
  value,
}: {
  icon: string;
  title: string;
  value: string;
}) {
  return (
    <div className="setting-row">
      <span className="setting-icon">
        {icon}
      </span>

      <div className="setting-info">
        <strong>{title}</strong>
        <span>{value}</span>
      </div>

      <span className="setting-arrow">
        ›
      </span>
    </div>
  );
}

export default App;
