# Fonctionnement actuel

## Intégration continue
```mermaid
graph TD
    build["earthly +dev"] --> test_all
    build --> cypress
    
    subgraph test_all
        curl["test curl"] -->
        pg_tap["db test"] -->
        pytest["test business"] -->
        dtapi["test API"] -->
        dtsqitch["test deploy"] -->
        jest["test front"]
    end
    
    cypress["end to end"]
```

## Déploiement continu
```mermaid
graph TD
    build["earthly +dev"] --> test_all
    build --> cypress

    subgraph test_all
        curl["test curl"] -->
        pg_tap["db test"] -->
        pytest["test business"] -->
        dtapi["test API"] -->
        dtsqitch["test deploy"] -->
        jest["test front"]
    end
    
    subgraph pgdeploy
        tag["sqitch tag"] --> 
        deploy["sqitch deploy"]
    end
    
    subgraph front_deploy
        merge["merge sur prod"] -->
        scalingo
    end
    
    supabase_cli["functions deploy"]
    
    cypress["end to end"]
```
  
## Workflow git
```mermaid
%%{init: { 'logLevel': 'debug', 'theme': 'base', 'gitGraph': {'showBranches': true, 'showCommitLabel':true,'mainBranchName': 'develop'}} }%%

gitGraph
commit
branch feature
commit id: "fix"
commit id: "feature"
checkout develop
merge feature
commit id: "plan tag" tag: "v2.x.y"
branch production
commit id: "pr release"
checkout develop
```
 
# Fonctionnement idéal               
## Intégration continue

```mermaid
graph TD
        
    subgraph unit_tests
%% todo rendre les tests du front indépendants du back
        jest["story shots et unit tests"]
        pg_tap["tests SQL"]
    end
    
%% todo   
    subgraph prebuild
        build_images["docker build"] -->
        cache_images["docker registry"]
    end

    build["earthly +dev"]

    subgraph integration_tests
        curl["tests curl"] -->
        pytest["tests business"] -->
        dtsqitch["test deploy"]
    end
    
    deno_test["tests API"]
    cypress["tests end-to-end"]
    
    unit_tests --> prebuild --> build
    build --> integration_tests 
    build --> deno_test 
    build --> cypress
```

            
## Cas 1

- db rétrocompatible avec le front et les edge functions
- edge functions rétrocompatibles avec le front

```mermaid
---
title: Cas 1
---
graph
    subgraph db_deploy
        tag["sqitch tag"] -->
        deploy["sqitch deploy"]
    end
    
    subgraph client_deploy
        site_deploy["site: scalingo CLI"]
        front_deploy["app: scalingo CLI"]
    end
    
    edge_deploy["functions deploy"]
    
    db_deploy --> dbs{"success ?"} 
    dbs -- no --> notification
    dbs -- yes --> edge_deploy
    
    edge_deploy --> eds{"success ?"}
    eds -- no --> notification
    eds -- yes --> client_deploy
    notification --> reparation_manuelle 
```

## Cas 2
- db non rétrocompatible avec le front et les edge functions

```mermaid
---
title: Cas 2
---
graph
    subgraph db_deploy
        tag["sqitch tag"] -->
        deploy["sqitch deploy"]
    end
    
    subgraph client_deploy
        site_deploy["site: scalingo CLI"]
        front_deploy["site: scalingo CLI"]
    end
    
    edge_deploy["functions deploy"]
    
    db_deploy --> dbs{"success ?"} 
    dbs -- no --> notification
    dbs -- yes --> mon["maintenance mode on"]
    mon --> edge_deploy
    
    edge_deploy --> eds{"success ?"}
    eds -- yes --> client_deploy
    eds -- no --> notification
    
    client_deploy -->cds{"success ?"}
    cds -- no --> notification
    cds -- yes --> moff
    
    moff["maintenance mode off"]
    notification --> reparation_manuelle --> moff
```
