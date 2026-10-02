# 🫖⚽ 5amsena Fantasy

### AI-Powered Premier League Match & Fantasy Predictor

> **Your Fantasy. Our AI. 5amsena.**

5amsena Fantasy is an AI-powered football analytics platform that combines **Premier League match predictions**, **player performance analysis**, and **Fantasy Premier League optimization** into one interactive experience.

The system uses football statistics, player analytics, fixture difficulty, team form, and machine learning to generate predictions and build an optimized **Best XI for every Gameweek**.

---

## 🚀 Live Demo

### 🌐 Try 5amsena Fantasy
<img width="936" height="446" alt="image" src="https://github.com/user-attachments/assets/4243907b-5609-477c-95ad-931d61e90de3" />


**[▶️ Live Demo — 5amsena Fantasy](https://drive.google.com/file/d/1NpmCxd-s_Cwy6VegZ96nwqCup4OLZmvk/view?usp=sharing)**

> 🫖 **Open the app, check the upcoming fixtures, explore AI predictions, and build your Gameweek Best XI.**

---

## 📸 Screenshots

### 🏠 Dashboard

The main dashboard provides an overview of the current Gameweek, upcoming fixtures, match predictions, top players, and AI recommendations.

<img width="932" height="448" alt="image" src="https://github.com/user-attachments/assets/aeec79b5-0aa8-45bf-9f98-f4923fdb9eee" />

---

### ⚽ Match Predictor

Select a Premier League fixture and receive AI-powered predictions for:

* Home Win probability
* Draw probability
* Away Win probability
* Expected goals
* Most likely score
* Likely goalscorers
* Assist candidates
* Defensive picks
* Man of the Match candidates


---

### 🏆 AI Best XI

The Best XI generator selects the strongest Fantasy lineup for the upcoming Gameweek while respecting formation and squad constraints.

---

### 👤 Player Analytics

Explore individual player statistics, predicted performance, expected FPL points, fixture difficulty, form, and attacking/defensive metrics.


---

## 🎯 Features

### ⚽ Match Outcome Prediction

Predict the probability of:

* 🏠 Home Win
* 🤝 Draw
* ✈️ Away Win

Predictions consider factors such as:

* Recent team form
* Home/Away performance
* Goals scored and conceded
* xG / xGA
* Team strength
* Player availability
* Injuries and suspensions
* Fixture context
* Recent head-to-head history

---

### 👟 Player Performance Prediction

For upcoming fixtures, the system estimates:

* ⚽ Goal probability
* 🎯 Assist probability
* 🧤 Clean-sheet probability
* ⭐ Expected FPL points
* 🏆 Man of the Match probability
* ⏱️ Expected minutes

---

### 🏆 AI Best XI Generator

Generate an optimized Fantasy XI for each Gameweek.

The optimizer considers:

* Expected FPL points
* Player price
* Position
* Fixture difficulty
* Team strength
* Player form
* Expected minutes

Constraints include:

* 1 Goalkeeper
* 3–5 Defenders
* 2–5 Midfielders
* 1–3 Forwards
* Maximum 3 players from the same club

Supported formations include:

```text
3-4-3
3-5-2
4-3-3
4-4-2
4-5-1
5-3-2
5-4-1
```

---

### 👑 Captain & Vice Captain

The system identifies captain and vice-captain candidates based on projected Gameweek performance.

Each recommendation includes the underlying statistics used by the model.

---

### 💎 Value & Differential Picks

Find players who provide strong expected performance relative to their FPL price.

The system can identify:

* 🔥 Premium Picks
* 💎 Value Picks
* 🎯 Differential Picks
* ⚠️ Rotation Risks

---

### 🔎 Player Search

Search for any player and explore:

* Current price
* FPL points
* Form
* Ownership
* Minutes
* Goals
* Assists
* xG
* xA
* Expected points
* Upcoming fixtures

---

### 🫖 Ahwa Chat

An optional AI football assistant inspired by the Egyptian **Ahwa** culture.

Ask questions in Egyptian Arabic such as:

> "أحط مين كابتن الجولة دي؟"

or

> "صلاح ولا ساكا؟"

The assistant uses the application's available football data and prediction outputs to provide an informal football discussion.

---

# 🧠 Machine Learning

5amsena Fantasy is designed as a real ML project rather than a collection of hard-coded football predictions.

## Match Prediction Pipeline

```text
Historical Data
      ↓
Data Cleaning
      ↓
Feature Engineering
      ↓
Team & Match Features
      ↓
ML Model
      ↓
Probability Calibration
      ↓
Match Prediction
```

### Match Features

Examples include:

* Recent form
* Goals scored
* Goals conceded
* xG
* xGA
* Home/Away record
* Team strength
* Player availability
* Fixture difficulty

### Models

The project supports models such as:

* Logistic Regression
* Random Forest
* XGBoost

Models are evaluated using metrics including:

* Accuracy
* Precision
* Recall
* F1-score
* Log Loss
* Confusion Matrix

For probabilistic predictions, **calibration and Log Loss** are considered alongside classification accuracy.

---

# 📊 Player Prediction

Player-level predictions use features such as:

```text
Minutes
Starts
Goals
Assists
Shots
Shots on Target
xG
xA
Big Chances
Clean Sheets
Defensive Contributions
Fixture Difficulty
Expected Minutes
Team Strength
Player Price
```

The output can include:

```text
Goal Probability
Assist Probability
Clean Sheet Probability
Expected FPL Points
MOTM Probability
```

---

# 🧮 FPL Optimization

The Best XI is generated using an optimization layer rather than simply selecting the 11 players with the highest predicted points.

Conceptually:

```text
Player Predictions
        ↓
Expected FPL Points
        ↓
Optimization Algorithm
        ↓
Formation Constraints
        ↓
Club Constraints
        ↓
🏆 Best XI
```

The optimizer respects:

```text
1 GK
3–5 DEF
2–5 MID
1–3 FWD
Maximum 3 players / club
```

The architecture can later be extended to support:

* Full 15-player squads
* Bench selection
* Captain
* Vice Captain
* Budget constraints
* Transfers
* Free transfers
* Chips

---

# 🔄 Data Pipeline

```text
External APIs
     ↓
Data Collection
     ↓
Validation
     ↓
Cleaning
     ↓
Feature Engineering
     ↓
Database / Cache
     ↓
ML Models
     ↓
Predictions
     ↓
FastAPI
     ↓
Frontend
```

The system is designed to avoid training and prediction directly from raw API responses.

---

# 🛡️ Data Leakage Prevention

Because football predictions are time-dependent, the project avoids using information that would not have been available before the predicted match.

Historical data is processed chronologically:

```text
Past Seasons
     ↓
Training
     ↓
Validation
     ↓
Current Season
     ↓
Future Predictions
```

This helps prevent future information from leaking into historical predictions.

---


# 📡 Data Sources

The application is designed to work with current Premier League and FPL data when available.

Potential data includes:

* FPL player information
* Player prices
* Player form
* FPL points
* Ownership
* Fixtures
* Gameweek information
* Player history
* Team statistics
* Match results
* Injuries and availability

The application should clearly distinguish between **live data**, **historical data**, and **demo/simulated data**.




# 📈 Future Improvements

Planned improvements include:

* [ ] Full 15-player FPL squad optimizer
* [ ] Transfer recommendations
* [ ] Free-transfer planning
* [ ] Bench optimization
* [ ] FPL chip strategy analysis
* [ ] Advanced player embeddings
* [ ] SHAP-based explanations
* [ ] Live injury/news analysis
* [ ] Historical model performance dashboard
* [ ] Automated Gameweek reports
* [ ] Improved player-minute prediction
* [ ] Mobile PWA
* [ ] Ahwa Chat with voice support

---

# ⚠️ Disclaimer

5amsena Fantasy provides **statistical and machine-learning-based estimates**.

Football matches and player performances are inherently unpredictable.

Predictions should not be interpreted as guarantees, financial advice, or certainty about future results.

If live data is unavailable, the application should clearly indicate that it is using cached, historical, or demo data.

---

# 🫖 Why "5amsena"?

Because football is not only about statistics.

Sometimes it's:

**كوباية شاي ☕ + ماتش ⚽ + صاحبك اللي بيقولك "حط اللاعب ده كابتن" 😂**

5amsena Fantasy brings that feeling into an AI-powered football analytics platform.

---

## ⭐ If You Like the Project

Give the repository a ⭐ on GitHub!

And if you have ideas, feel free to open an issue or contribute.

---

### Built with 🫖 + ⚽ + 🤖

**5amsena Fantasy**

*Your Fantasy. Our AI.*
