# MARSWALK pitch (current app)

Live app: https://marswalk-jet.vercel.app/

## One line

> MARSWALK lets a crew plan a walk on Mars with no internet. It shows where the science is,
> whether they can climb there, and the exact minute they must turn back. It's built on real,
> cross-checked NASA data, and it's honest about what that data can't tell you.

## Who it is for

- **Main user (vision):** an astronaut crew and its science lead planning a walk outside the
  habitat. They have limited air and power, no live help from Earth (4–24 min each way) and
  unknown terrain.
- **Who could use it today:** Mars analogue mission crews rehearsing traverse planning, and
  planetary-science students and teachers working with real NASA data.

These are target users to test with. No group has used it yet.

## Their problems, and how MARSWALK solves them

| Question | What MARSWALK does |
|---|---|
| Where's the interesting science? | One layered map: HiRISE 25 cm image, CRISM sulfate layer from two observations, USGS regional geology, Curiosity science records |
| Can I physically walk there? | 1 m HiRISE elevation model: slope overlay, elevation profile, steepest grade, grade-limit warning, suggested lower-grade route |
| Will I get back with air to spare? | Time budget with extra time for climbing and descending: outbound and return legs, protected reserve, margin, turn-back time |
| What if there's no connection? | Installable offline app; the whole data pack is stored and checked on the device |
| Can I trust this map? | Terrain lines up with the image to about 0.2 m; the confidence panel says what the data does and doesn't support |
| How do I record and share? | Notebook, saved routes, mission file export |

## 60-second demo (built into the app)

1. Open the app. The welcome card explains it in one screen.
2. Click **Start the demo walk**. A route is drawn from low ground to the strongest sulfate signal,
   the sulfate layer turns on, and the example time budget loads.
3. Point at the HUD above the map: about 310 m one way, 72 m of climb, turn back by 1:09, +23 min
   margin.
4. Point at **Steepest: over limit**. The planner flags a stretch steeper than the 15° limit. Open
   the route suggestion in **Plan route** to find a lower-grade path.
5. Toggle **Relief** and **Slope**, and hover the map to read elevation, slope and sulfate index.
6. Open the status dropdown, choose **Prepare offline**, then reload with no connection. The app
   still works.

## Say carefully

- Say "plan and rehearse", not "safe route". The app does not certify safety.
- The sulfate index shows an absorption signature, not a confirmed mineral amount.
- The study area is one ~500 m HiRISE patch in Gale Crater. The method applies to other HiRISE
  stereo sites, but only this one is prepared.
