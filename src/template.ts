export const HTMLCode: string = `<!DOCTYPE html>
<html lang="en">

<head>
    <title>PUG</title>
    <script type="text/javascript">
        const foo = true;
        let bar = function() {};
        if (foo) {
            bar(1 + 5)
        }
    </script>
</head>

<body>
    <h1>PUG - node template engine</h1>
    <div class="col" id="container">
        <p>You are amazing</p>
        <p>
            PUG is a terse and simple
            templating language with a
            strong focus on performance
            and powerful features.
        </p>
    </div>
</body>

</html>`;

export const JADECode: string = `doctype html
html(lang='en')
    head
        title PUG
        script(type='text/javascript').
            const foo = true;
            let bar = function() {};
            if (foo) {
                bar(1 + 5)
            }
    body
        h1 PUG - node template engine
        #container.col
            p You are amazing
            p
                | PUG is a terse and simple
                | templating language with a
                | strong focus on performance
                | and powerful features.
`;
