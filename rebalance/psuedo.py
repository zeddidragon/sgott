realBurstRate = 60
realAPS = 60
burstCount = 300

burstTime = ((1/realBurstRate)*burstCount) + (1/realAPS)

if (realBurstRate):
    print (burstTime)
    print (1/(burstTime/burstCount))
else:
    print(realAPS)