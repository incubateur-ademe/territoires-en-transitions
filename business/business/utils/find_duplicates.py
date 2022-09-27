def find_duplicates(l: list) -> list:
    return [x for n, x in enumerate(l) if x in l[:n]]
