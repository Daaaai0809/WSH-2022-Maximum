import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import React, { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components";

import { Container } from "../../components/layouts/Container";
import { Spacer } from "../../components/layouts/Spacer";
import { Stack } from "../../components/layouts/Stack";
import { Heading } from "../../components/typographies/Heading";
import { useAuthorizedFetch } from "../../hooks/useAuthorizedFetch";
import { useFetch } from "../../hooks/useFetch";
import { Color, Radius, Space } from "../../styles/variables";
import { authorizedJsonFetcher, jsonFetcher } from "../../utils/HttpUtils";

import { RecentRaceList } from "./internal/RecentRaceList";

const Image = styled.img`
  display: block;
  margin: 0 auto;
`;

const ChargeDialog = lazy(() => import('./internal/ChargeDialog'));

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * @param {Model.Race[]} races
 * @returns {Model.Race[]}
 */
function useTodayRacesWithAnimation(races) {
  const [isRacesUpdate, setIsRacesUpdate] = useState(false);
  const [racesToShow, setRacesToShow] = useState([]);
  const numberOfRacesToShow = useRef(0);
  const prevRaces = useRef(races);
  const timer = useRef(null);

  useEffect(() => {
    const isRacesUpdate = races.map(e => e.id).some(id => !prevRaces.current.map(e => e.id).includes(id));

    prevRaces.current = races;
    setIsRacesUpdate(isRacesUpdate);
  }, [races]);

  useEffect(() => {
    if (!isRacesUpdate) {
      return;
    }
    // 視覚効果 off のときはアニメーションしない
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setRacesToShow(races);
      return;
    }

    numberOfRacesToShow.current = 0;
    if (timer.current !== null) {
      clearInterval(timer.current);
    }

    timer.current = setInterval(() => {
      if (numberOfRacesToShow.current >= races.length) {
        clearInterval(timer.current);
        return;
      }

      numberOfRacesToShow.current++;
      setRacesToShow(races.slice(0, numberOfRacesToShow.current));
    }, 100);
  }, [isRacesUpdate, races]);

  useEffect(() => {
    return () => {
      if (timer.current !== null) {
        clearInterval(timer.current);
      }
    };
  }, []);

  return racesToShow;
}

/** @type {React.VFC} */
export const Top = () => {
  const { date = dayjs().format("YYYY-MM-DD") } = useParams();

  const ChargeButton = styled.button`
    background: ${Color.mono[700]};
    border-radius: ${Radius.MEDIUM};
    color: ${Color.mono[0]};
    padding: ${Space * 1}px ${Space * 2}px;

    &:hover {
      background: ${Color.mono[800]};
    }
  `;

  const chargeDialogRef = useRef(null);

  const { data: userData, revalidate } = useAuthorizedFetch(
    "/api/users/me",
    authorizedJsonFetcher,
  );

  const { data: raceData } = useFetch("/api/races", jsonFetcher);

  const handleClickChargeButton = useCallback(() => {
    if (chargeDialogRef.current === null) {
      return;
    }

    chargeDialogRef.current.showModal();
  }, []);

  const handleCompleteCharge = useCallback(() => {
    revalidate();
  }, [revalidate]);

  const todayRaces = useMemo(() => 
      raceData != null
        ? [...raceData.races]
            .sort(
              (/** @type {Model.Race} */ a, /** @type {Model.Race} */ b) =>
              dayjs(a.startAt).unix() - dayjs(b.startAt).unix(),
            )
            .filter((/** @type {Model.Race} */ race) =>
              dayjs(race.startAt).isSame(dayjs(date), 'day'),
            )
        : []
    ,[raceData, date]);

  const todayRacesToShow = useTodayRacesWithAnimation(todayRaces);

  const [displayedItems, setDisplayedItems] = useState(10);

  const handleScroll = useCallback(() => {
    const { scrollTop, clientHeight, scrollHeight } = window.document.documentElement;
    if (scrollTop + clientHeight === scrollHeight) {
      setDisplayedItems(prevItems => prevItems + 10);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  return (
    <Container>
      <Image src="/assets/images/hero.webp" loading="eager" alt="hero" />

      <Spacer mt={Space * 2} />
      {userData && (
        <Stack horizontal alignItems="center" justifyContent="space-between">
          <div>
            <p>ポイント残高: {userData.balance}pt</p>
            <p>払戻金: {userData.payoff}Yeen</p>
          </div>

          <ChargeButton onClick={handleClickChargeButton}>
            チャージ
          </ChargeButton>
        </Stack>
      )}

      <Spacer mt={Space * 2} />
      <Suspense fallback="">
        <section>
          <Heading as="h1">本日のレース</Heading>
          {todayRacesToShow.length > 0 && (
            <RecentRaceList>
              {/* {todayRacesToShow.map((race) => (
                <RecentRaceList.Item key={race.id} race={race} />
              ))} */}

              {/* 最初10件までを表示して、スクロールしたら次の10件を表示する */}
              {todayRacesToShow.slice(0, displayedItems).map((race) => (
                <RecentRaceList.Item key={race.id} race={race} />
              ))}

            </RecentRaceList>
          )}
        </section>
      </Suspense>

      <Suspense fallback="">
        <ChargeDialog ref={chargeDialogRef} onComplete={handleCompleteCharge} />
      </Suspense>
    </Container>
  );
};
