# C# feladatok

Két konzolos alkalmazás (.NET 8), közös solutionben (`Feladatok.sln`).

```
dotnet run --project Futsal
dotnet run --project BuffaloHunter
```

## 1. Futsal csapat (`Futsal/`)

- `Position` – a posztok: `Goalkeeper`, `Forward`, `Winger`, `Defender`.
- `Player` – név és poszt (konstruktorból), a `ToString` mindkettőt visszaadja.
- `Team` – `players` tömb, `NumberOfPlayers`, `IsFull`, `IsIncluded`, `IsAvailable`, `Include`.
  A felállás 1 kapus, 1 csatár, 2 szélső és 1 védő. Az `Include` kivételt dob, ha a
  játékos nem kerülhet be a csapatba.
- `Program.RandomPlayers(int)` – egyedi nevű, véletlen posztú játékosokat generál.

Indításkor 20 játékos generálódik. A felhasználó sorszám alapján választ közülük, amíg a csapat
meg nem telik (0 = kilépés). A program jelzi, ha egy játékos már a csapatban van, ha a posztja
betelt, illetve ha a megmaradt játékosokból már nem állítható össze teljes csapat.

## 2. Bölényvadász (`BuffaloHunter/`)

- `Field` – a pálya mérete, `TargetX`/`TargetY` (jobb alsó sarok), `AllowedPosition`, `Show`
  (keret és sor-/oszlopszámok).
- `Buffalo` – pozíció és állapot, `X`/`Y`/`IsActive`, `Move(Field)`, `Deactivate`, `Show`
  (zöld `B` az aktív, piros `B` a kilőtt bölény).
- `Game` – `IsOver`, konstruktor (pályaméret, bölények száma), privát `VisualizeElements` és
  `Shoot`, valamint `Run`.
- `Input.ReadInt` – addig kérdez, amíg érvényes számot nem kap.

Egy kör menete: minden aktív bölény lép, kirajzolódik az állás, majd a felhasználó lő. A bölények
lépnek először, különben a (0, 0) mezőre leadott első lövés az egész csordát eltalálná. Ha egy
aktív bölény célba ér, a játék lövés nélkül véget ér. A pálya mérete legfeljebb 20, hogy kiférjen
egy átlagos konzolablakba.
