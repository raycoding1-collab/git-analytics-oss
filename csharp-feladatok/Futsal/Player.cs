class Player
{
    private readonly string name;
    private readonly Position pos;

    public Player(string name, Position pos)
    {
        this.name = name;
        this.pos = pos;
    }

    public string Name => name;
    public Position Pos => pos;

    public override string ToString() => $"{name} ({pos})";
}
