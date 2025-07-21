import matplotlib.figure as pltfg


def save_figure(name: str, figure: pltfg.Figure, size: tuple = (4, 3)):
    """
    Save the current figure thesis folder
    """
    figure.set_size_inches(size)
    figure.savefig(
        f"/Users/simon2/Documents/thesis-msc/stats/output/{name}.svg",
        dpi=1200,
        format="svg",
    )
