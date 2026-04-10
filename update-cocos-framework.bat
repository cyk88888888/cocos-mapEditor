md extensions
cd extensions

IF EXIST cocos-framework (
goto update
) ELSE (
goto clone
)

:clone
git clone https://github.com/cyk88888888/cocos-framework.git

:update
cd cocos-framework
git pull