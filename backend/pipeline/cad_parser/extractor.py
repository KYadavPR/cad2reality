def extract_dimensions(doc):

    msp = doc.modelspace()

    xs = []
    ys = []

    for entity in msp:

        if entity.dxftype() == "LINE":

            xs.append(entity.dxf.start.x)
            xs.append(entity.dxf.end.x)

            ys.append(entity.dxf.start.y)
            ys.append(entity.dxf.end.y)

    width = max(xs) - min(xs)
    height = max(ys) - min(ys)

    return {"width": width, "height": height}


def count_vertical_bars(doc):

    msp = doc.modelspace()

    count = 0

    for entity in msp:

        if entity.dxftype() == "LINE":

            start = entity.dxf.start
            end = entity.dxf.end

            # vertical line
            if start.x == end.x:

                # ignore outer frame sides
                if start.y != end.y:
                    count += 1

    # subtract left and right frame
    return max(count - 2, 0)
