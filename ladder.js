var selectedUsers = []; // 전역 스코프에 변수 정의

$(function () {

    // 초기 이미지 클릭 이벤트 핸들러
    $('#initialImage').click(function() {
        $(this).fadeOut(500, function() {
            $('#ladder').fadeIn(500);
            init(); // 초기화 함수 호출
        });
    });

    // 홈 화면으로 돌아가기 버튼 클릭 이벤트
    $('#homebtn').click(function() {
        // 사다리게임 페이지를 부드럽게 숨깁니다.
        $('#ladder').fadeOut(500, function() {
            // 이미지 및 랜딩 페이지를 부드럽게 표시합니다.
            $('#initialImage').fadeIn(500); // 추가: 초기 이미지를 다시 표시합니다.
            $('#ect').fadeIn(500);         // 기존에 추가한 이미지
            $('#landing').fadeIn(500);     // 랜딩 페이지
        });

        // 배경 음악 중지
        var audio = document.getElementById('ladder-drawing-sound');
        if (audio) {
            audio.pause();
            audio.currentTime = 0; // 오디오 트랙을 시작 지점으로 되돌립니다.
        }
    });

    var heightNode = 20;
    var widthNode = 0;
    var LADDER = {};
    var row = 0;
    var ladder = $('#ladder');
    var ladder_canvas = $('#ladder_canvas');
    var GLOBAL_FOOT_PRINT = {};
    var GLOBAL_CHECK_FOOT_PRINT = {};
    var working = false;

    function init() {
        widthNode = 39; // 예시 참여자 수를 설정합니다.
        heightNode = 20; // 사다리의 높이 설정
    
        $('#ladder').css({
            'margin-left': '40px',
            'margin-right': '40px'
        });
    
        canvasDraw(); // 캔버스 드로우 함수 호출
        userSetting(widthNode); // 참여자 설정 함수 호출
    }

    // 랜딩 페이지에서 참여자 수를 받고 userSetting 함수를 호출하는 이벤트 핸들러
    $('#button').on('click', function () {
        var member = $('input[name=member]').val();
        if (member < 2) {
            return alert('최소 2명 이상 선택하세요.');
        }

        if (member > 40) {
            return alert('너무 많아요.. ㅠㅠ');
        }

        $('#landing').css({
            'opacity': 0
        });

        widthNode = member;
        setTimeout(function () {
            $('#landing').remove();
            init();
            userSetting(member); // 참여자 수에 따라 userSetting 함수 호출
        }, 310);
    });

    // 결과 번호를 저장하기 위한 객체
    var resultNumbers = {};
    // 결과를 저장하기 위한 배열
    var resultsArray = [];

    function initResultNumbers() {
        for (var i = 0; i < widthNode; i++) {
            resultNumbers[i + '-0'] = null; // 초기화
        }
    }

    // 사다리 게임 결과를 설정하는 함수
    function setResultNumber(node, resultNumber) {
        resultNumbers[node] = resultNumber;
    }



    // ★ 캔버스 드로우 함수
    function canvasDraw() {
        // 캔버스 크기 및 기본 설정
        ladder.css({
            'width': (widthNode - 1) * 100 + 6,
            'height': (heightNode - 1) * 25 + 6,
            'background-color': '#fff'
        });

        ladder_canvas
            .attr('width', (widthNode - 1) * 100 + 6)
            .attr('height', (heightNode - 1) * 25 + 6);

        setDefaultFootPrint();
        reSetCheckFootPrint();
        setDefaultRowLine();
        setRandomNodeData();
        drawDefaultLine();
        drawNodeLine();
        resultSetting();
    }


    var userName = "";


    // 화면 확대,축소,기본설정
   // 확대/축소 관련 변수
   var zoomLevel = 1;

   // 확대 버튼 클릭 이벤트
   $('#zoomIn').click(function() {
       zoomLevel += 0.5;
       $('body').css('zoom', zoomLevel);
   });

//    // 축소 버튼 클릭 이벤트
//    $('#zoomOut').click(function() {
//        zoomLevel -= 0.5;
//        $('body').css('zoom', zoomLevel);
//    });

   // 원래 크기 버튼 클릭 이벤트
   $('#zoomReset').click(function() {
       zoomLevel = 1;
       $('body').css('zoom', zoomLevel);
   });

    // 게임시작하면 섞기 버튼 두개 display:none되게
    $(document).on('click', 'button.ladder-start', function(e) {
        if(working) {
            return false;
        }
        working = true;

        // '사람 섞기'와 '사다리 섞기' 버튼을 부드럽게 숨김
        $('.mix, .mix_ladder').fadeOut(500); // 여기에서 500ms로 설정

        var _this = $(e.target);
        _this.attr('disabled', true).css('background-color', '#D3D3D3');
        var node = _this.attr('data-node');
        var color =  _this.attr('data-color');
        startLineDrawing(node, color);
        userName = $('input[data-node="'+node+'"]').val();
    });



    // 사용자 배열을 랜덤으로 섞는 함수
    function shuffleUsers(users) {
        for (let i = users.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [users[i], users[j]] = [users[j], users[i]];
        }
        return users;
    }

    // '사람 섞기' 버튼 클릭 이벤트 핸들러
    $('.mix').on('click', function () {
        // 사운드 효과 재생
        playSwoshSound();

        // 기존 로직
        selectedUsers = shuffleUsers(selectedUsers); 
        $('.user-wrap').remove();
        userSetting(widthNode);
    });

    // '사다리 섞기' 버튼 클릭 이벤트 핸들러
    $('.mix_ladder').on('click', function () {
        // 사운드 효과 재생
        playSwoshSound();

        // 기존 로직
        resetLadder();
    });



    // 사다리선 그리기 부분
    function startLineDrawing(node, color) {

        // 사다리선이 그려질 때 효과음 재생
        playLadderDrawingSound();

        var node = node;
        var color = color;

        var x = node.split('-')[0] * 1;
        var y = node.split('-')[1] * 1;
        var nodeInfo = GLOBAL_FOOT_PRINT[node];

        GLOBAL_CHECK_FOOT_PRINT[node] = true;

        var dir = 'r'

        // 게임종료 판별
        if (y == heightNode) {
            // 사다리가 도착 지점에 도달하면 해당 결과를 표시합니다.
            var modal = document.getElementById("modal");
            var modalText = document.getElementById("modal-text");
            var span = document.getElementsByClassName("close")[0];

            // 모달 텍스트에 사용자 이름과 도착 번호를 포함시킵니다.
            var resultNumber = getResultNumberForNode(node);
            modalText.innerHTML = "<div style='font-weight: bold; font-size: 50px; color: " + color + "; text-shadow: 3px 3px 0px rgba(0, 0, 0, 0.5);'>" + userName + "<br>" + resultNumber + "</div>";
            showModal(userName, resultNumber, color); // 모달 표시 함수 호출

             // 결과를 하단에 표시
            displayResult(userName, resultNumber);
            //showModal(); // 모달 표시 함수 호출

            // 결과 배열에 사용자 이름과 경품을 추가
            resultsArray.push({ userName: userName, prize: resultNumbers[node] });

            // 결과를 표시하는 함수 호출
            displayResult();

            // 모달 창 닫기 버튼
            span.onclick = function () {
                hideModal(); // 모달 숨기기 함수 호출
            }

            // 모달 창 바깥 영역 클릭 시 닫기
            window.onclick = function (event) {
                if (event.target == modal) {
                    hideModal(); // 모달 숨기기 함수 호출
                }
            }

            $('div.answer-wrap').each(function () {
                var dataNode = $(this).find('input').data('node');
                if (dataNode === node) {
                    $(this).css('display', 'block');
                }
            });

            reSetCheckFootPrint();
            var target = $('input[data-node="' + node + '"]');
            target.css({
                'background-color': color
            });
            $('#' + node + "-user").text(userName);

            working = false;
            return false;

        }

        if (nodeInfo["change"]) {
            var leftNode = (x - 1) + "-" + y;
            var rightNode = (x + 1) + "-" + y;
            var downNode = x + "-" + (y + 1);
            var leftNodeInfo = GLOBAL_FOOT_PRINT[leftNode];
            var rightNodeInfo = GLOBAL_FOOT_PRINT[rightNode];

            if (GLOBAL_FOOT_PRINT.hasOwnProperty(leftNode) && GLOBAL_FOOT_PRINT.hasOwnProperty(rightNode)) {
                var leftNodeInfo = GLOBAL_FOOT_PRINT[leftNode];
                var rightNodeInfo = GLOBAL_FOOT_PRINT[rightNode];
                if ((leftNodeInfo["change"] && leftNodeInfo["draw"] && !!!GLOBAL_CHECK_FOOT_PRINT[leftNode]) && (rightNodeInfo["change"]) && leftNodeInfo["draw"] && !!!GLOBAL_CHECK_FOOT_PRINT[rightNode]) {
                    //Left우선 
                    console.log("중복일때  LEFT 우선");
                    stokeLine(x, y, 'w', 'l', color, 3)
                    setTimeout(function () {
                        return startLineDrawing(leftNode, color)
                    }, 150);
                }
                else if ((leftNodeInfo["change"] && !!!leftNodeInfo["draw"] && !!!GLOBAL_CHECK_FOOT_PRINT[leftNode]) && (rightNodeInfo["change"]) && !!!GLOBAL_CHECK_FOOT_PRINT[rightNode]) {
                    console.log('RIGHT 우선')
                    stokeLine(x, y, 'w', 'r', color, 3)
                    console.log("right")
                    setTimeout(function () {
                        return startLineDrawing(rightNode, color)
                    }, 150);
                }
                else if ((leftNodeInfo["change"] && leftNodeInfo["draw"] && !!!GLOBAL_CHECK_FOOT_PRINT[leftNode]) && (!!!rightNodeInfo["change"])) {
                    //Left우선 
                    console.log("LEFT 우선");
                    stokeLine(x, y, 'w', 'l', color, 3)
                    setTimeout(function () {
                        return startLineDrawing(leftNode, color)
                    }, 150);
                }
                else if (!!!leftNodeInfo["change"] && (rightNodeInfo["change"]) && !!!GLOBAL_CHECK_FOOT_PRINT[rightNode]) {
                    //Right우선 
                    console.log("RIGHT 우선");
                    stokeLine(x, y, 'w', 'r', color, 3)
                    setTimeout(function () {
                        return startLineDrawing(rightNode, color)
                    }, 150);
                }
                else {
                    console.log('DOWN 우선')
                    stokeLine(x, y, 'h', 'd', color, 3)
                    setTimeout(function () {
                        return startLineDrawing(downNode, color)
                    }, 150);
                }
            } else {
                console.log('else')
                if (!!!GLOBAL_FOOT_PRINT.hasOwnProperty(leftNode) && GLOBAL_FOOT_PRINT.hasOwnProperty(rightNode)) {
                    /// 좌측라인
                    console.log('좌측라인')
                    if ((rightNodeInfo["change"] && !!!rightNodeInfo["draw"]) && !!!GLOBAL_CHECK_FOOT_PRINT[rightNode]) {
                        //Right우선 
                        console.log("RIGHT 우선");
                        stokeLine(x, y, 'w', 'r', color, 3)
                        setTimeout(function () {
                            return startLineDrawing(rightNode, color)
                        }, 150);
                    } else {
                        console.log('DOWN')
                        stokeLine(x, y, 'h', 'd', color, 3)
                        setTimeout(function () {
                            return startLineDrawing(downNode, color)
                        }, 150);
                    }

                } else if (GLOBAL_FOOT_PRINT.hasOwnProperty(leftNode) && !!!GLOBAL_FOOT_PRINT.hasOwnProperty(rightNode)) {
                    /// 우측라인
                    console.log('우측라인')
                    if ((leftNodeInfo["change"] && leftNodeInfo["draw"]) && !!!GLOBAL_CHECK_FOOT_PRINT[leftNode]) {
                        //Right우선 
                        console.log("LEFT 우선");
                        stokeLine(x, y, 'w', 'l', color, 3)
                        setTimeout(function () {
                            return startLineDrawing(leftNode, color)
                        }, 150);
                    } else {
                        console.log('DOWN')
                        stokeLine(x, y, 'h', 'd', color, 3)
                        setTimeout(function () {
                            return startLineDrawing(downNode, color)
                        }, 150);
                    }
                }
            }
        } else {
            console.log("down")
            var downNode = x + "-" + (y + 1);
            stokeLine(x, y, 'h', 'd', color, 3)
            setTimeout(function () {
                return startLineDrawing(downNode, color)
            }, 150);
        }
    }

    // 모달을 표시하는 함수
    function showModal() {
        var modal = document.getElementById("modal");
        modal.style.display = "block"; // 먼저 display 속성 변경

        // 브라우저가 display 변경을 인식한 후 opacity 변경
        requestAnimationFrame(function () {
            modal.classList.add('show');
        });

        // 모달 효과음 재생
        playModalSound();

        // 오디오 재생 중지
        // stopLadderDrawingSound();
    }

    // 결과 번호와 사용자 이름을 저장하기 위한 객체
    var prizeWinners = {};

    // 게임 종료시 결과를 하단 결과 영역에 누적하여 표시하는 함수
    function displayResult(userName, resultNumber) {
        // 유효한 resultNumber만 처리
        if (resultNumber) {
            // 경품별 당첨자 이름 추가
            if (!prizeWinners[resultNumber]) {
                prizeWinners[resultNumber] = [];
            }
            prizeWinners[resultNumber].push(userName);

            // 결과 표시 전체를 재구성
            var resultsDiv = document.getElementById("results");
            resultsDiv.innerHTML = '';
            for (var prize in prizeWinners) {
                if (prizeWinners.hasOwnProperty(prize) && prizeWinners[prize].length > 0) {
                    var newResult = document.createElement("div");
                    newResult.textContent = prize + ": " + prizeWinners[prize].join(", ");
                    newResult.style.display = "block";
                    newResult.style.marginRight = "10px";
                    newResult.style.fontWeight = "bold";
                    newResult.style.fontSize = "14px";
                    newResult.style.paddingBottom = "10px";
                    resultsDiv.appendChild(newResult);
                }
            }
        }
    }


    // 모달을 숨기는 함수
    function hideModal() {
        var modal = document.getElementById("modal");
        modal.classList.remove('show'); // opacity 변경

        // 트랜지션 종료 후 display 변경
        modal.addEventListener('transitionend', function () {
            modal.style.display = "none";
        }, { once: true });
    }


    // ★ input 위 홈초이스 임직원들 이름 추가
    // 참여자 수에 따라 사용자 인터페이스를 생성하는 함수
    function userSetting(memberCount) {
        // 각 그룹별 멤버와 해당 그룹의 색상
        var groups = [
            { members: ["김태율", "문준우"], color: '#006400' }, // 초록
            { members: ["배성호", "이권재", "박민진", "한승미", "김진서", "오지민"], color: '#B22222' }, // 빨강
            { members: ["박진일", "정미진", "오서희", "김혜주", "신미정", "박민섭"], color: '#FFBF00' }, // 노랑
            { members: ["고훈석", "한민지", "김상우", "장예지", "김다민", "이가희", "최민정", "심예은"], color: '#FF4500' }, // 주황
            { members: ["김성구", "서혜림", "정구민", "조우창", "서지원"], color: '#084B8A' }, // 파랑
            { members: ["유흥식", "최민회", "조정흠", "장준원", "이병훈", "신동준", "김미리", "강선균"], color: '	#9370DB' }, // 보라
            { members: ["전진형", "김윤길", "김도영", "이혜지"], color: '#DB7093' }  // 핑크
        ];

        // 모든 사용자를 하나의 배열로 결합
        var allUserList = groups.flatMap(group => group.members);

        // 선택된 사용자 이름을 추적하는 배열
        var selectedUserNames = [];

        // 참여자 수에 따라 랜덤하게 사용자 선택
        var selectedUsers = [];
        while (selectedUsers.length < memberCount) {
            var randomIndex = Math.floor(Math.random() * allUserList.length);
            var selectedUser = allUserList[randomIndex];

            // 중복 확인
            if (!selectedUserNames.includes(selectedUser)) {
                selectedUsers.push({ name: selectedUser, color: findColorForUser(selectedUser, groups) });
                selectedUserNames.push(selectedUser); // 이름 추가
            }
        }

        var html = '';
        var inputWidth = 100; // input의 가로 너비
        var xOffset = 25; // x축 이동 거리 (왼쪽으로)
        var yOffset = 55; // y축 이동 거리 (위로)

        selectedUsers.forEach(function (user, i) {
            var left = (i * inputWidth) - xOffset;
            var top = -yOffset; // y축 이동

            html += '<div class="user-wrap" style="left:' + left + 'px; top:' + top + 'px;">';
            html += '<input maxlength="3" type="text" value="' + user.name + '" data-node="' + i + '-0" disabled style="width:100px; text-align: center; border: none; font-size: 16px; padding-right:50px; background-color:transparent; z-index:999;">';
            html += '<button class="ladder-start" style="background-color:' + user.color + '" data-color="' + user.color + '" data-node="' + i + '-0"></button>';
            html += '</div>';
        });

        ladder.append(html);
        ladder.css('width', (selectedUsers.length * inputWidth) - xOffset + 'px'); // ladder의 너비 조정
    }

    function findColorForUser(userName, groups) {
        for (var i = 0; i < groups.length; i++) {
            if (groups[i].members.includes(userName)) {
                return groups[i].color;
            }
        }
        return '#FFFFFF'; // 기본 색상
    }


    // 특정 노드에 대한 결과 번호를 가져오는 함수
    function getResultNumberForNode(node) {
        return resultNumbers[node];
    }


    // ★ input 아래 두번째 수정
    function resultSetting() {     
        // 경품 설정
        var prizes = {
            "20만원": 5, // 20만원 경품 5개
            "10만원": 10, // 10만원 경품 10개
            "5만원": 24 // 5만원 경품 24개
        };

        // 결과 텍스트 배열 생성
        var resultTexts = [];
        for (var prize in prizes) {
            for (var i = 0; i < prizes[prize]; i++) {
                resultTexts.push(prize);
            }
        }
        
        var resultList = LADDER[heightNode - 1];
        var html = '';

        for (var i = 0; i < resultList.length; i++) {
            var x = resultList[i].split('-')[0] * 1;
            var y = resultList[i].split('-')[1] * 1 + 1;
            var node = x + "-" + y;
            var left = x * 100 - 30;

            if (resultTexts.length > 0) {
                var randomIndex = Math.floor(Math.random() * resultTexts.length);
                var randomText = resultTexts[randomIndex];
                resultTexts.splice(randomIndex, 1); // 선택된 숫자 제거

                // 결과 번호 설정
                setResultNumber(node, randomText);

                // 결과 입력 부분을 보이게 설정
                html += '<div class="answer-wrap" style="left:' + left + 'px; display: block;">'; // display 속성을 block으로 변경
                // html += '<input type="text" value="' + randomText + '" disabled style="display: none; border: none; background-color:transparent; font-weight: bold;">';
                html += '<p id="' + node + '-user" style="font-size: 20px; margin-bottom: 13px;"></p>';
                html += '</div>';
            }
        }

        ladder.append(html);
    }

    
    // 홈초이스 로고 클릭시 엔딩 이미지
    $('#logoImage').click(function() {
        // "happynewyear.png" 이미지를 전체 화면으로 표시
        $('#newYearImage').css({
            'position': 'fixed', // 고정 위치
            'top': '0',         // 상단에서 0px
            'left': '0',        // 좌측에서 0px
            'width': '100%',    // 너비 100%
            'height': '100%',   // 높이 100%
            'object-fit': 'cover', // 이미지가 비율을 유지하면서 전체 영역을 채움
            'z-index': '10000'  // z-index를 높여 다른 요소들 위에 표시
        }).fadeIn(1000); // 1초(1000ms) 동안 부드럽게 나타나는 효과

        // 배경 음악 중지
        var audio = document.getElementById('ladder-drawing-sound');
        if (audio) {
            audio.pause();
            audio.currentTime = 0; // 오디오 트랙을 시작 지점으로 되돌립니다.
        }
        
    });


    // 사다리게임 효과음 중지
    // function stopLadderDrawingSound() {
    //     var audio = document.getElementById("ladder-drawing-sound");
    //     if (audio) {
    //         audio.pause();
    //         audio.currentTime = 0; // 사운드를 처음으로 되돌림
    //     }
    // }




    // 디폴트 가로줄
    function drawNodeLine() {

        for (var y = 0; y < heightNode; y++) {
            for (var x = 0; x < widthNode; x++) {
                var node = x + '-' + y;
                var nodeInfo = GLOBAL_FOOT_PRINT[node];
                if (nodeInfo["change"] && nodeInfo["draw"]) {
                    stokeLine(x, y, 'w', 'r', '#737373', '2')
                } else {

                }
            }
        }
    }

    function stokeLine(x, y, flag, dir, color, width) {
        var canvas = document.getElementById('ladder_canvas');
        var ctx = canvas.getContext('2d');
        var moveToStart = 0, moveToEnd = 0, lineToStart = 0, lineToEnd = 0;
        var eachWidth = 100;
        var eachHeight = 25;
        if (flag == "w") {
            //가로줄


            if (dir == "r") {
                ctx.beginPath();
                moveToStart = x * eachWidth;
                moveToEnd = y * eachHeight;
                lineToStart = (x + 1) * eachWidth;
                lineToEnd = y * eachHeight;

            } else {
                // dir "l"
                ctx.beginPath();
                moveToStart = x * eachWidth;
                moveToEnd = y * eachHeight;
                lineToStart = (x - 1) * eachWidth;
                lineToEnd = y * eachHeight;
            }
        } else {
            ctx.beginPath();
            moveToStart = x * eachWidth;
            moveToEnd = y * eachHeight;
            lineToStart = x * eachWidth;
            lineToEnd = (y + 1) * eachHeight;
        }

        ctx.moveTo(moveToStart + 3, moveToEnd + 2);
        ctx.lineTo(lineToStart + 3, lineToEnd + 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.stroke();
        ctx.closePath();

    }

    // 디폴트 세로줄
    function drawDefaultLine() {
        var html = '';
        html += '<table>'
        for (var y = 0; y < heightNode - 1; y++) {
            html += '<tr>';
            for (var x = 0; x < widthNode - 1; x++) {
                html += '<td style="width:98px; height:25px; border-left:2px solid #737373; border-right:2px solid #737373;"></td>';
            }
            html += '</tr>';
        }
        html += '</table>'
        ladder.append(html);
    }


    // 사다리 구조를 재구성하는 함수
    function resetLadder() {
        clearLadder();      // 기존 사다리 지우기
        setRandomNodeData(); // 랜덤한 노드 데이터 생성
        drawDefaultLine();  // 기본 세로선 다시 그리기
        drawNodeLine();     // 새로운 노드 라인 그리기
    }

    // 기존 사다리 지우는 함수
    function clearLadder() {
        // 캔버스 내용 직접 지우기
        var canvas = document.getElementById('ladder_canvas');
        if (canvas.getContext) {
            var ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        // 기존 노드 요소 제거
        $('.node').remove();

        // 기본 노드 줄 다시 설정
        setDefaultRowLine();
    }

    // '사다리 섞기' 버튼 클릭 이벤트 핸들러
    $('.mix_ladder').on('click', function () {
        resetLadder(); // 사다리 구조 재설정
    });

    function setRandomNodeData() {
        // 기존 노드 데이터 초기화
        GLOBAL_FOOT_PRINT = {};

        for (var y = 0; y < heightNode; y++) {
            for (var x = 0; x < widthNode; x++) {
                var rand = Math.floor(Math.random() * 2);
                var loopNode = x + "-" + y;
                
                if (rand === 0 || x === widthNode - 1) {
                    GLOBAL_FOOT_PRINT[loopNode] = { "change": false, "draw": false };
                } else {
                    GLOBAL_FOOT_PRINT[loopNode] = { "change": true, "draw": true };
                    // 다음 노드를 건너뛰기
                    x++;
                    loopNode = x + "-" + y;
                    GLOBAL_FOOT_PRINT[loopNode] = { "change": true, "draw": false };
                }
            }
        }
    }

    function setDefaultFootPrint() {

        for (var r = 0; r < heightNode; r++) {
            for (var column = 0; column < widthNode; column++) {
                GLOBAL_FOOT_PRINT[column + "-" + r] = false;
            }
        }
    }
    function reSetCheckFootPrint() {

        for (var r = 0; r < heightNode; r++) {
            for (var column = 0; column < widthNode; column++) {
                GLOBAL_CHECK_FOOT_PRINT[column + "-" + r] = false;
            }
        }
    }

    function setDefaultRowLine() {

        for (var y = 0; y < heightNode; y++) {
            var rowArr = [];
            for (var x = 0; x < widthNode; x++) {
                var node = x + "-" + row;
                rowArr.push(node);
                // 노드그리기
                var left = x * 100;
                var top = row * 25;
                var node = $('<div></div>')
                    .attr('class', 'node')
                    .attr('id', node)
                    .attr('data-left', left)
                    .attr('data-top', top)
                    .css({
                        'position': 'absolute',
                        'left': left,
                        'top': top
                    });
                ladder.append(node);
            }
            LADDER[row] = rowArr;
            row++;
        }
    }


    // 사다리게임 효과음
    function playLadderDrawingSound() {
        var audio = document.getElementById("ladder-drawing-sound");
        audio.autoplay = false; // Disable autoplay
        audio.controls = true; // Enable user controls
        audio.play();
    }


    // 사운드 효과 재생 함수
    function playSwoshSound() {
        var audio = document.getElementById("swosh");
        if (audio) {
            audio.play();
        }
    }

    // 모달 효과음 재생 함수
    function playModalSound() {
        var audio = document.getElementById("modal-sound");
        if (audio) {
            audio.play();
        }
    }

});
