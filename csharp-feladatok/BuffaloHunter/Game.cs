using System;

class Game
{
    private readonly Field field;
    private readonly Buffalo[] buffaloes;
    private int round;
    private string message = "";

    public Game(int size, int buffaloCount)
    {
        field = new Field(size);
        buffaloes = new Buffalo[buffaloCount];
        for (int i = 0; i < buffaloes.Length; i++)
            buffaloes[i] = new Buffalo();
    }

    public bool IsOver => AllShot || ReachedTarget;

    private bool AllShot => ActiveCount == 0;

    private bool ReachedTarget
    {
        get
        {
            foreach (Buffalo buffalo in buffaloes)
            {
                if (buffalo.IsActive && buffalo.X == field.TargetX && buffalo.Y == field.TargetY)
                    return true;
            }
            return false;
        }
    }

    private int ActiveCount
    {
        get
        {
            int count = 0;
            foreach (Buffalo buffalo in buffaloes)
            {
                if (buffalo.IsActive)
                    count++;
            }
            return count;
        }
    }

    public void Run()
    {
        while (!IsOver)
        {
            // A bölények lépnek először, különben az első lövés a (0, 0)-ra mindet eltalálná.
            round++;
            foreach (Buffalo buffalo in buffaloes)
                buffalo.Move(field);

            VisualizeElements();
            if (!IsOver)
                Shoot();
        }

        VisualizeElements();
        Console.WriteLine(AllShot
            ? "Gratulálok, minden bölényt kilőttél, mielőtt célba értek volna!"
            : "A bölények győztek: egyikük elérte a célt.");
    }

    private void VisualizeElements()
    {
        Console.Clear();
        field.Show();

        // Előbb a kilőtt bölények, így közös mezőn az aktív (zöld) látszik.
        foreach (Buffalo buffalo in buffaloes)
        {
            if (!buffalo.IsActive)
                buffalo.Show();
        }
        foreach (Buffalo buffalo in buffaloes)
        {
            if (buffalo.IsActive)
                buffalo.Show();
        }

        Console.SetCursorPosition(0, Field.OffsetY + field.Size + 2);
        Console.WriteLine($"{round}. kör | aktív bölények: {ActiveCount}/{buffaloes.Length} | cél: ({field.TargetX}, {field.TargetY})");
        if (message != "")
            Console.WriteLine(message);
    }

    private void Shoot()
    {
        Console.WriteLine("Hová lősz?");
        int x = Input.ReadInt($"  x (0-{field.TargetX}): ", 0, field.TargetX);
        int y = Input.ReadInt($"  y (0-{field.TargetY}): ", 0, field.TargetY);

        int hits = 0;
        foreach (Buffalo buffalo in buffaloes)
        {
            if (buffalo.IsActive && buffalo.X == x && buffalo.Y == y)
            {
                buffalo.Deactivate();
                hits++;
            }
        }

        message = hits > 0
            ? $"Előző lövés ({x}, {y}): talált, {hits} bölény kiesett."
            : $"Előző lövés ({x}, {y}): mellé.";
    }
}
