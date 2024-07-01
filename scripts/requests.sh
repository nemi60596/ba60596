#!/bin/bash

# Request routes in andorra
#curl "http://localhost:5000/route/v1/driving/1.521835,42.506317;1.5235,42.5075?overview=full&steps=true&geometries=geojson&annotations=true&continue_straight=false" | jq '.' > osrm.json
#curl -X POST http://localhost:8002/route --data '{"locations":[{"lat":42.506317,"lon":1.521835},{"lat":42.506886,"lon":1.522094}],"costing":"auto","directions_options":{"units":"miles"}}' | jq '.' > valhalla.json
#curl "http://localhost:8989/route?point=42.506317,1.521835&point=42.5075,1.5235&profile=car&locale=en&instructions=true&points_encoded=false" | jq '.' >graphhopper.json

# Frankfurt - Zürich
#curl "http://localhost:5000/route/v1/driving/8.6821,50.1109;8.5417,47.3769?overview=full&steps=true&geometries=geojson&annotations=true&continue_straight=false" | jq '.' > osrm.json
#curl -X POST http://localhost:8002/route --data '{"locations":[{"lat":50.1109,"lon":8.6821},{"lat":47.3769,"lon":8.5417}],"costing":"auto","directions_options":{"units":"kilometers"}}' | jq '.' > valhalla.json
#curl "http://localhost:8989/route?point=50.1109,8.6821&point=47.3769,8.5417&profile=car&locale=en&instructions=true&points_encoded=false" | jq '.' > graphhopper.json

# München - Stuttgart
#curl "http://localhost:5000/route/v1/driving/11.5820,48.1351;9.1829,48.7758?overview=full&steps=true&geometries=geojson&annotations=true&continue_straight=false" | jq '.' > osrm_germany.json

# Simple request
#curl "http://localhost:5000/route/v1/driving/8.6821,50.1109;8.5417,47.3769" | jq '.' > osrm.json
#curl -X POST http://localhost:8002/route --data '{"locations":[{"lat":50.1109,"lon":8.6821},{"lat":47.3769,"lon":8.5417}],"costing":"auto"}' | jq '.' > valhalla.json
#curl "http://localhost:8989/route?point=50.1109,8.6821&point=47.3769,8.5417&profile=car" | jq '.' > graphhopper.json


#curl "http://localhost:5000/route/v1/driving/8.403653,49.006889;7.842104,47.999008" | jq '.' > KA-FR.json
#curl "http://localhost:5000/route/v1/driving/36.211322,-115.219116;36.111322,-115.219116" | jq '.' > DC-NY.json


# KA - BERN
curl "http://localhost:5000/route/v1/driving/8.4037,49.0069;7.4474,46.9480" | jq '.' > osrm.json
curl -X POST http://localhost:8002/route --data '{"locations":[{"lat":49.0069,"lon":8.4037},{"lat":46.9480,"lon":7.4474}],"costing":"auto"}' | jq '.' > valhalla.json
curl "http://localhost:8989/route?point=49.0069,8.4037&point=46.9480,7.4474&profile=car" | jq '.' > graphhopper.json


### Valhalla Map Matching

# curl -X POST 'http://localhost:8002/trace_attributes' \                                                                                                                                                                            
# -H 'Content-Type: application/json' \
# -d '{
#   "shape": [
#     {"lat": 52.5200, "lon": 13.4050},
#     {"lat": 52.5205, "lon": 13.4055},
#     {"lat": 52.5207, "lon": 13.4060},
#     {"lat": 52.5210, "lon": 13.4065}
#   ],
#   "costing": "auto",
#   "shape_match": "walk_or_snap",
#   "filters": {
#     "attributes": ["edge.names", "edge.id", "edge.weighted_grade", "edge.speed", "edge.toll", "edge.length", "admin.state_code", "admin.state_text", "admin.country_code", "admin.country_text", "node.admin_index", "matched_point.distance_from_trace_point"],
#     "action": "include"
#   }
# }' | jq



# curl -X POST 'http://localhost:8002/trace_attributes' \
# -H 'Content-Type: application/json' \
# -d '{
#   "shape": [
#     {"lat": 42.5063, "lon": 1.5218},
#     {"lat": 42.5083, "lon": 1.5349},
#     {"lat": 42.5105, "lon": 1.5380},
#     {"lat": 42.5368, "lon": 1.5828} 
#   ],
#   "costing": "auto",
#   "shape_match": "walk_or_snap",
#   "filters": {
#     "attributes": ["edge.names", "edge.id", "edge.weighted_grade", "edge.speed", "edge.toll", "edge.length", "admin.state_code", "admin.state_text", "admin.country_code", "admin.country_text", "node.admin_index", "matched_point.distance_from_trace_point"],
#     "action": "include"
#   }
# }' | jq



# curl -X POST 'http://localhost:8002/trace_attributes' \
# -H 'Content-Type: application/json' \
# -d '{
#   "encoded_polyline":"}_gyyAs_srM|C`w@{l@nJgMdCq^dH{C`A_j@zQcH~B_WtGkc@tLsAe@qAu@y@w@s@gAeBaEiAeDoAuBwA{@sB]oBHaG`CiClIoAhEm@`AmDvFmB|CwC|EiHdEcAf@gCnA{DvAkA\\mLhDiG|@eGRyUw@}CUuWqAmFWcCMg@EsBKeIg@kAGcGYg_@kBcKg@iBGuNk@yI]sEQkHWqMQsBDcHNuLWgFl@qNtCqBr@{DhCgCNkCD{CA_DSuJmLoQkTeQaUyEyGyCiEaBcCom@sbAeXaf@iI_KaMwTsUed@}p@ooAwf@k_AuRg`@qQca@wEcLoFaNsLu]oNwd@uKab@}@iDuLgj@uJsl@cA}GcDcVeC{SqAaMsBaTcBiUuBg\\eC{c@gCud@g@k^WmKa@kLg@wL{@}NyAaVWyD]uEqB}U}CzC_HrHk@r@SXmChDqTxYuEfI{BxEuGpLiH|F{D~HeDjI}EvNeDfMmBdKoB|LkAhNo@dL]rLEjMJnN~@rMjAvPtBjNfCdOxG~UbEfPpEfRrBnPp@lKXtKCnMM`Z{B~PoEba@cChV{C|_@sB~^{A~_@_B`r@CzaAZ~[tAzf@lBrf@zDpn@rCx[bDf[~Et_@tHre@pAbHhJpd@dNpk@vNhg@pWf}@bN`i@xJdf@fCtNpE`]zBpSrBxTnAhU~@xTb@vULb^Sn\\}@j_@iAtViD~c@mGrs@eCj_@{@rPi@hPc@`VG`c@FxNl@vSrB|_@|Cxf@rEb`@zHnf@pItb@bY|sApIzj@bHdq@vApWvAvWlA`d@n@lk@j@dhC|Ad~AnExxA`Ept@jBbYpK`oAbI|s@~WjtBxQdsArQ`wAvFve@tDb\\tKveAtGrq@`Exe@bJ|pAlEfx@pDjx@hDn~@nBnx@vB|gArFhzClIhoDpTpeGxDb}@vAhXvBh_@dCn]hDd]dDfX`Gv`@xFn]`EvSbHt[`Il[lJl_@rXj~@|n@xkBzYpz@xZ|}@|Yb~@v\\liAhSfv@bUtaAlSncA|R~fAvE|WdLfo@xMtu@^zB|G``@bOvw@jMhn@jF`TlGjXbMnb@pJt[|BvIzE`QzClJzAlEzSvo@pEbOrDzNfBtJRpHIpH_AzJ_BhGsCjFyDjDwEvB{EbAyGTuGQ{HcAsCeAkAw@cEaEgCkIi@uJx@cKnAwFzNc]lxAknBnb@{n@vf@wv@h`@gp@lTu_@rImOve@g{@jiAgyBbe@e~@fZ}k@~u@uvA|e@sz@ri@o{@ff@_s@xm@sx@lh@kn@dd@ye@pe@{d@jQwOzY}V`e@g_@j_@mWb`@cWpl@}]rLqGxx@ma@~YiMl\\qMl\\cLnHwCbKaDtq@uRpv@mQvb@iJj[{G~TaF`]uHdhAmV|J_CxCo@lEeAxZoG~Q_EjJoAlXmChF]hF_@hc@w@`^h@zSfA`SbBhp@xJpoAvSlMbClwC~h@zzAtU`a@lGtHnAlMtArjAvHfRfBrLbB`OfCfPpC|NbDzfB`g@hq@dWvSdJdHlDrGxGbYpPps@bb@vDpB|EvBdKpD~OnEjHjB~JlB`Gv@pHf@nJDnKY`NgA|MqBhYqErNwAbKRhE^hCVpARpHpAdM|BrYxFbh@tIbEj@vElAxGpCfBpArB|Ah@~@p@r@r@d@t@Tx@Hv@Cv@Qn@[l@g@hCXjBTxANpDVdIl@bR`CtFr@jg@dGpDj@jEv@nEtAtKzAx^~Dl^|DjJx@nQp@xI\\hDFzDJtRZ~\\r@`DHbWr@fFDpNExNSrT[hGAB^h@|I~Ffj@p@hGfJz}@`BvOd@vEb@bEfAvKHv@DZvHjt@l@zFp@lGfFlh@xA`ONxAZ~Cb@fEN|A|BbVl@fGl@fGbCxV^vDrArNVnCT`CHx@Dh@`@~DPxAvD~^tD`^~BdUn@lFr@vFtAvKh@~DbBjIlKfi@zJ|g@fA`Fnp@v}CjHd]`BdIvApGVdA`AjEJ`@JZtDzFb@p@hErG~CzEhDdFjVb_@d@t@bCrDvCkDl@u@`OmQtDoEtDoExToWxa@uq@dDcI`@_At@}Cj@gEj@gGr@sGzAqFpIeUxA}Ev@mDVwCV{CMwCUaBIg@rCwBzAsAn@k@|@}@pDiEhFiIrH}MxHcMnCaDlF_FzDyBdMcIx@m@lGuElEqDjBqBbAqB~@{BRi@dAcEv@{Cn@sBp@_BvGaLf@kA^cAV{@\\sCBwA"
# ,
#   "costing": "auto",
#   "shape_match": "walk_or_snap",
#   "filters": {
#     "attributes": ["edge.names", "edge.id", "edge.weighted_grade", "edge.speed", "edge.toll", "edge.length", "admin.state_code", "admin.state_text", "admin.country_code", "admin.country_text", "node.admin_index", "matched_point.distance_from_trace_point"],
#     "action": "include"
#   }

# }' | jq

# curl "http://localhost:5000/route/v1/driving/7.661593,47.614764;7.588576,47.559599" | jq '.' > osrm.json